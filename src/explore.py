"""Recompute participant profiles and exploratory contrasts from the supplied CSVs.

Run from any directory with Python, numpy, polars, scipy and scikit-learn:
    uv run src/explore.py
All p-values are two-sided except omnibus cluster validation and the explicitly upper-tail reference simulation.
"""

import argparse
from itertools import combinations
from pathlib import Path

import numpy as np
import polars as pl
from scipy import stats
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TASKS = ("Paintings", "Quotes")
FEATURES = ["ac_pre", "value_pre", "log_gap_pre"]
KS = range(2, 6)
SEED = 9327


def behavioral_profiles(task):
	b = pl.read_csv(DATA / f"{task}Behaviour.csv", skip_rows=int(task == "Paintings"))
	b.columns = [name.lower().replace(" ", "") for name in b.columns]
	assert not b.select("trueid", "round").is_duplicated().any()
	np.testing.assert_allclose(b["performance"], 4 * b["sb"] * (1 + 2 * b["ac"]))
	profiles = []
	for records in b.sort("trueid", "round").partition_by(
		"trueid", maintain_order=True
	):
		identifier = records["trueid"][0]
		np.testing.assert_array_equal(records["round"], np.arange(1, len(records) + 1))
		pre = records.filter(pl.col("half") == 1)
		post = records.filter(pl.col("half") == 2)
		assert pre["round"][-1] + 1 == post["round"][0]
		assert len(pre) % 2 == 0 and len(post) % 2 == 0
		assert (records["time"].diff().drop_nulls() > 0).all()
		for half in (pre, post):
			assert half.select("risk", "change", "novelty").n_unique() == 1
		assert pre["change"][0] == pre["novelty"][0] == 0
		a, z = pre["risk"][0], post["risk"][0]
		assert post["change"][0] == z - a
		start = "H" if a else "L"
		arm = (
			(start if post["novelty"][0] else start + "c")
			if a == z
			else ("HL" if a else "LH")
		)

		def gap(half):
			times = half["time"].to_numpy().reshape(-1, 2)
			return np.median(times[:, 1] - times[:, 0])

		performance = pl.col("performance")
		mean_pre = pre.select(performance.mean()).item()
		mean_post = post.select(performance.mean()).item()
		near_pre = pre.select(performance.tail(2).mean()).item()
		near_post = post.select(performance.head(2).mean()).item()
		profiles.append(
			{
				"task": task,
				"trueid": identifier,
				"arm": arm,
				"prefix": identifier.rstrip("0123456789"),
				"screens_pre": len(pre),
				"screens_post": len(post),
				"ac_pre": pre["ac"].mean(),
				"ac_post": post["ac"].mean(),
				"value_pre": pre["sb"].mean(),
				"value_post": post["sb"].mean(),
				"gap_pre": gap(pre),
				"gap_post": gap(post),
				"log_gap_pre": np.log(gap(pre)),
				"performance_pre": mean_pre,
				"performance_post": mean_post,
				"delta": mean_post - mean_pre,
				"delta_near": near_post - near_pre,
			}
		)
	return pl.DataFrame(profiles)


def fit_k(x, k, seed=SEED):
	return KMeans(n_clusters=k, n_init=15, random_state=seed).fit(x)


def candidate_scores(x):
	models = {k: fit_k(x, k) for k in KS}
	scores = {k: silhouette_score(x, model.labels_) for k, model in models.items()}
	return models, scores


def clustering(profile, rng):
	raw = profile.select(FEATURES).to_numpy()
	x = StandardScaler().fit_transform(raw)
	models, scores = candidate_scores(x)
	best = max(scores, key=scores.get)
	model = models[best]
	# Name profiles in ascending order of their baseline AC for consistent reading.
	ids = np.argsort(model.cluster_centers_[:, 0])
	labeled = profile.with_columns(
		pl.Series("cluster", np.argsort(ids)[model.labels_] + 1)
	)
	# Separate recovery at fixed k from how often the subsample selects that k.
	recovery = []
	selections = {k: 0 for k in KS}
	for _ in range(300):
		train = np.sort(rng.choice(len(x), int(0.8 * len(x)), replace=False))
		test = np.setdiff1d(np.arange(len(x)), train)
		scaler = StandardScaler().fit(raw[train])
		sub_models, sub_scores = candidate_scores(scaler.transform(raw[train]))
		selections[max(sub_scores, key=sub_scores.get)] += 1
		model_sub = sub_models[best]
		recovery.append(
			adjusted_rand_score(
				model.labels_[test], model_sub.predict(scaler.transform(raw[test]))
			)
		)
	# Parametric reference for a single continuous cloud. Repeat the full k search.
	null = []
	for _ in range(299):
		sim = rng.multivariate_normal(np.zeros(x.shape[1]), np.cov(x.T), len(x))
		_, score_sim = candidate_scores(StandardScaler().fit_transform(sim))
		null.append(max(score_sim.values()))
	ward = AgglomerativeClustering(n_clusters=best).fit_predict(x)
	return labeled, dict(
		task=profile["task"][0],
		k=best,
		**{f"silhouette_k{k}": scores[k] for k in KS},
		**{f"subsample_wins_k{k}": selections[k] for k in KS},
		silhouette=scores[best],
		ari_oob_median=np.median(recovery),
		ari_oob_q25=np.quantile(recovery, 0.25),
		ari_oob_q75=np.quantile(recovery, 0.75),
		ward_ari=adjusted_rand_score(model.labels_, ward),
		gaussian_null_median=np.median(null),
		gaussian_null_q95=np.quantile(null, 0.95),
		gaussian_reference_p=(1 + sum(v >= scores[best] for v in null))
		/ (1 + len(null)),
	)


def dimension_links(p):
	"""Within-person profiles, compared across people in the same task and half."""
	return [
		{
			"task": p["task"][0],
			"feature_a": a,
			"feature_b": b,
			"n": len(p),
			"rho": stats.spearmanr(p[a], p[b]).statistic,
		}
		for a, b in combinations(FEATURES, 2)
	]


def paired_stage(task, mode):
	col = "pupilsize" if mode == "Pupil" else "heartrate"
	d = pl.read_csv(
		DATA / f"{task}{mode}.csv",
		columns=["trueID", "round", "phase", col],
		schema_overrides={col: pl.Float64},
		null_values=["NA", "NaN"],
	).rename({"trueID": "trueid"})
	# Average within each phase before giving each complete round equal weight.
	rounds = (
		d.drop_nulls(["trueid", "round"])
		.group_by("trueid", "round")
		.agg(
			pl.col(col).filter(pl.col("phase") == 0).mean().alias("a"),
			pl.col(col).filter(pl.col("phase") == 1).mean().alias("b"),
		)
		.drop_nulls()
	)
	return rounds.group_by("trueid").agg(pl.col("a", "b").mean()).sort(
		"trueid"
	), rounds.height


def gaze_choices(task):
	# Compare first and fourth choices within identical screens. Analyze counts of
	# valid gaze samples, avoiding dwell-time assumptions about timing gaps.
	pairs, audit = [], []
	for file in sorted(
		(DATA / "eye_tracking" / "eyetracking").glob(f"{task}_*_eyetracking.csv")
	):
		d = pl.read_csv(
			file,
			columns=["phase", "round", "decphase", "choice", "PicID", "chosen"],
			null_values="NA",
		)
		screen = pl.col("phase").str.extract(r"^Dec(\d+)$").cast(pl.Int64)
		is_decision = pl.col("decphase") > 0
		mismatch = is_decision & (
			(pl.col("decphase") != screen) | (pl.col("round") != (screen + 1) // 2)
		).fill_null(True)
		mismatch_samples = d.select(mismatch.sum()).item()
		# Ambiguous screen chronology makes within-screen pairing unreliable.
		n_screens = 0
		if not mismatch_samples:
			choice, chosen, pic = pl.col("choice"), pl.col("chosen"), pl.col("PicID")
			valid = pic.is_between(1, 20)
			counts = (
				d.filter(is_decision & choice.is_in([1, 4]) & chosen.is_between(1, 20))
				.group_by("decphase", "choice")
				.agg(
					valid.sum().alias("valid"),
					(valid & (pic == chosen)).sum().alias("hit"),
					chosen.n_unique().alias("targets"),
				)
				.filter((pl.col("valid") > 0) & (pl.col("targets") == 1))
			)
			fraction = pl.col("hit") / pl.col("valid")
			screens = (
				counts.group_by("decphase")
				.agg(
					fraction.filter(choice == 1).first().alias("a"),
					fraction.filter(choice == 4).first().alias("b"),
				)
				.drop_nulls()
			)
			n_screens = screens.height
			if n_screens:
				a, b = screens.select(pl.col("a", "b").mean()).row(0)
				pairs.append({"file": file.name, "a": a, "b": b})
		audit.append(
			{
				"task": task,
				"file": file.name,
				"mismatch_samples": mismatch_samples,
				"paired_screens": n_screens,
			}
		)
	return (
		pl.DataFrame(
			pairs, schema={"file": pl.String, "a": pl.Float64, "b": pl.Float64}
		),
		pl.DataFrame(
			audit,
			schema={
				"task": pl.String,
				"file": pl.String,
				"mismatch_samples": pl.Int64,
				"paired_screens": pl.Int64,
			},
		),
	)


def signed_contrast(task, name, groups, weights, unit):
	"""Independent participant means with a Welch-Satterthwaite interval on a contrast."""
	arrays = [np.asarray(g, dtype=float) for g in groups]
	means = np.array([np.mean(a) for a in arrays])
	sizes = np.array([len(a) for a in arrays])
	weights = np.asarray(weights)
	var_parts = weights**2 * np.array([np.var(a, ddof=1) for a in arrays]) / sizes
	se = np.sqrt(np.sum(var_parts))
	df = np.sum(var_parts) ** 2 / np.sum(var_parts**2 / (sizes - 1))
	estimate = float(means @ weights)
	radius = stats.t.ppf(0.975, df) * se
	return {
		"task": task,
		"test": name,
		"unit": unit,
		"n": int(sizes.sum()),
		"group_sizes": "|".join(map(str, sizes)),
		"estimate": estimate,
		"ci_low": estimate - radius,
		"ci_high": estimate + radius,
		"p": 2 * stats.t.sf(abs(estimate / se), df),
	}


def paired(task, name, p, unit):
	result = signed_contrast(task, name, [p["b"] - p["a"]], [1], unit)
	return dict(result, mean_a=p["a"].mean(), mean_b=p["b"].mean())


def behavioral_tests(p):
	task = p["task"][0]
	ctrl = p.filter(pl.col("arm").is_in(["Hc", "Lc"]))
	results = [
		paired(
			task,
			"control_post_minus_pre",
			ctrl.rename({"performance_pre": "a", "performance_post": "b"}),
			"pence",
		)
	]
	for window in ("delta", "delta_near"):
		groups = [
			p.filter(pl.col("arm") == arm)[window] for arm in ["H", "Hc", "L", "Lc"]
		]
		results.append(
			signed_contrast(
				task,
				"novelty_minus_control_" + window,
				groups,
				[0.5, -0.5, 0.5, -0.5],
				"pence",
			)
		)
	for arm, control in [("HL", "Hc"), ("LH", "Lc")]:
		results.append(
			signed_contrast(
				task,
				arm + "_minus_" + control,
				[p.filter(pl.col("arm") == a)["delta"] for a in (arm, control)],
				[1, -1],
				"pence",
			)
		)
	for col in ["ac", "value", "gap"]:
		r = stats.spearmanr(p[col + "_pre"], p[col + "_post"])
		results.append(
			{
				"task": task,
				"test": col + "_pre_post_rho",
				"n": len(p),
				"estimate": r.statistic,
				"p": r.pvalue,
				"unit": "rho",
			}
		)
	return results


def cluster_outcome(p):
	# Welch omnibus test uses second-half performance, which was withheld from clustering.
	groups = [
		g["performance_post"].to_numpy()
		for g in p.sort("cluster").partition_by("cluster", maintain_order=True)
	]
	test = stats.f_oneway(*groups, equal_var=False)
	return {
		"task": p["task"][0],
		"test": "cluster_post_performance",
		"n": len(p),
		"p": test.pvalue,
		"estimate": test.statistic,
		"unit": "Welch F",
	}


def novelty_sensitivity(p, rng):
	# Keep the same equal weighting of initial high and low risk used in the main contrast.
	arms = ["H", "Hc", "L", "Lc"]
	weights = np.array([0.5, -0.5, 0.5, -0.5])
	d = p.filter(pl.col("arm").is_in(arms))
	resampled = []
	for arm in arms:
		changes = d.filter(pl.col("arm") == arm)["delta"].to_numpy()
		resampled.append(rng.choice(changes, (10000, len(changes))).mean(axis=1))
	low, high = np.quantile(weights @ np.stack(resampled), [0.025, 0.975])
	baseline = pl.col("performance_pre") - pl.col("performance_pre").mean()
	design = d.select(
		*[(pl.col("arm") == arm).cast(pl.Float64).alias(arm) for arm in arms], baseline
	).to_numpy()
	coefficients = np.linalg.lstsq(
		design, d["performance_post"].to_numpy(), rcond=None
	)[0]
	return {
		"task": p["task"][0],
		"change_bootstrap_low": low,
		"change_bootstrap_high": high,
		"baseline_adjusted_post_contrast": weights @ coefficients[:4],
	}


def run(out):
	out.mkdir(exist_ok=True, parents=True)
	all_profiles, test_rows, cluster_rows, gaze_qc, novelty_checks = [], [], [], [], []
	for task_i, task in enumerate(TASKS):
		p = behavioral_profiles(task)
		p, checks = clustering(p, np.random.default_rng(SEED + task_i))
		cluster_rows.append(checks)
		test_rows.extend(behavioral_tests(p))
		test_rows.append(cluster_outcome(p))
		novelty_checks.append(
			novelty_sensitivity(p, np.random.default_rng(SEED + 10 + task_i))
		)
		for mode in ["Pupil", "Heart"] if task == "Paintings" else ["Pupil"]:
			participants, paired_rounds = paired_stage(task, mode)
			r = paired(
				task,
				mode.lower() + "_decision_minus_exploration",
				participants,
				"adjusted source units",
			)
			test_rows.append(dict(r, paired_rounds=paired_rounds))
		gaze, audit = gaze_choices(task)
		test_rows.append(
			paired(
				task,
				"gaze_choice4_minus_choice1",
				gaze.with_columns(pl.col("a", "b") * 100),
				"percentage points",
			)
		)
		gaze_qc.append(audit)
		all_profiles.append(p)
	results = pl.from_dicts(test_rows, schema_overrides={"paired_rounds": pl.Float64})
	# Holm over all behavioral, physiological, gaze and held-out outcome tests across both tasks.
	# The separate Gaussian diagnostics describe clustering geometry only.
	results = (
		results.with_row_index()
		.sort("p")
		.with_columns(
			(pl.col("p") * (pl.len() - pl.int_range(pl.len())))
			.cum_max()
			.clip(upper_bound=1)
			.alias("p_holm")
		)
		.sort("index")
		.drop("index")
	)
	profiles = pl.concat(all_profiles)
	centroids = (
		profiles.group_by("task", "cluster")
		.agg(
			pl.len().alias("n"),
			pl.col("ac_pre", "value_pre").mean(),
			pl.col("gap_pre").median(),
			pl.col("performance_post").mean(),
		)
		.sort("task", "cluster")
	)
	for filename, table in [
		("participant_profiles", profiles),
		("clusters", centroids),
		(
			"dimension_links",
			pl.DataFrame([row for p in all_profiles for row in dimension_links(p)]),
		),
		("cluster_checks", pl.DataFrame(cluster_rows)),
		("contrasts", results),
		("novelty_checks", pl.DataFrame(novelty_checks)),
		("gaze_coverage", pl.concat(gaze_qc)),
	]:
		table.write_csv(out / (filename + ".csv"))


if __name__ == "__main__":
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("--output", type=Path, default=ROOT / "output")
	with threadpool_limits(limits=1):
		run(parser.parse_args().output)
