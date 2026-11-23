"""Predict first-screen performance from earlier scores and exploration pupil size."""

import argparse
import json
import pickle
from pathlib import Path

import numpy as np
import polars as pl
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SPLITS = {
	"Paintings": {
		"train": """
			H1307 H1318 H1323 H1342 H1466 H1507 H1776
			HL1044 HL1248 HL1471 HL1735 Hc1603 Hc1669 Hc1741 Hc1859
			L1006 L1020 L1437 L1751 LH1097 LH1305 LH1573 LH1816
			Lc1003 Lc1049 Lc1086 Lc1368 Lc1847
		""",
		"validation": "HL1090 HL1548 Hc1515 Hc1998 LH1722 LH1948 Lc1278 Lc1664",
	},
	"Quotes": {
		"train": """
			H1041 H1050 H1364 H1402 H1433 H1656 H1802 H1820 H1834
			HL1295 HL1357 HL1417 HL1459 HL1654 HL1762 HL1949
			Hc1436 Hc1443 Hc1562 Hc1620 Hc1674 Hc1818
			L1373 L1455 L1642 L1794 L1952 LH1177 LH1255 LH1581 LH1610 LH1829 LH1837 LH1885
			Lc1018 Lc1033 Lc1280 Lc1453 Lc1756 Lc1814 Lc1983
		""",
		"validation": "H1926 HL1595 HL1609 HL1645 Hc1156 Hc1702 L1166 L1168 L1175 Lc1243 Lc1531",
	},
}
ALIGNMENT = ["trueID", "cycle", "half", "risk", "change", "novelty"]
HISTORY = ["previous_performance", "history_mean"]
FEATURES = {"history_only": HISTORY, "task3": [*HISTORY, "pupil_explore"]}
BASELINE = "previous_cycle"
FOLDS = 5


def behavior(task, assignment):
	rows = pl.read_csv(
		DATA / f"{task}Behaviour.csv", skip_rows=int(task == "Paintings")
	)
	rows.columns = [name.lower().replace(" ", "") for name in rows.columns]
	screens = rows.rename(
		{"trueid": "trueID", "round": "screen", "performance": "actual"}
	).join(assignment, on="trueID", how="inner", validate="m:1")
	first = screens.filter(pl.col("screen") % 2 == 1).with_columns(
		((pl.col("screen") + 1) // 2).alias("cycle"),
		pl.col("actual").cast(pl.Float64),
	)
	if (
		first.select("trueID", "cycle").is_duplicated().any()
		or first.filter(
			~pl.col("half").is_in([1, 2]).fill_null(False)
			| ~pl.col("actual").is_finite().fill_null(False)
		).height
	):
		raise ValueError(f"Invalid first-screen scores in {task}")
	actual = pl.col("actual")
	segment = ["trueID", "half"]
	return first.with_columns(
		actual.shift().over(segment, order_by="cycle").alias("previous_performance"),
		(actual.cum_sum() / actual.cum_count())
		.shift()
		.over(segment, order_by="cycle")
		.alias("history_mean"),
	).select("split", "screen", "actual", *ALIGNMENT, *HISTORY)


def exploration(task, source, column, feature):
	data = pl.read_csv(
		DATA / f"{task}{source}.csv",
		columns=[
			"trueID",
			"round",
			"half",
			"risk",
			"change",
			"novelty",
			"phase",
			column,
		],
		schema_overrides={column: pl.Float64},
		null_values=["NA", "NaN"],
	)
	return (
		data.filter((pl.col("phase") == 0) & pl.col(column).is_finite())
		.rename({"round": "cycle", column: feature})
		.select(*ALIGNMENT, feature)
	)


def build_samples():
	assignment = pl.DataFrame(
		[
			{"task": task, "split": split, "trueID": true_id}
			for task, splits in SPLITS.items()
			for split, ids in splits.items()
			for true_id in ids.split()
		]
	)
	if assignment["trueID"].n_unique() != assignment.height:
		raise ValueError("The fixed split lists contain duplicate trueIDs")

	parts = []
	for task in SPLITS:
		cohort = behavior(task, assignment.filter(pl.col("task") == task).drop("task"))
		# Construct history before checking biometric coverage.
		pupil = exploration(task, "Pupil", "pupilsize", "pupil_explore")
		heart = exploration(task, "Heart", "heartrate", "heart_explore")
		parts.append(
			cohort.join(pupil, on=ALIGNMENT, how="left", validate="1:1")
			.join(heart, on=ALIGNMENT, how="left", validate="1:1")
			.with_columns(pl.lit(task).alias("task"))
		)

	candidates = pl.concat(parts).filter(pl.col("previous_performance").is_not_null())
	samples = candidates.drop_nulls(["pupil_explore", "heart_explore"]).sort(
		"task", "trueID", "cycle"
	)
	split_keys = ["task", "split"]
	counts = (
		assignment.group_by(*split_keys)
		.len(name="listed_participants")
		.join(
			candidates.group_by(*split_keys).agg(
				pl.len().alias("candidate_cycles"),
				pl.col("pupil_explore").null_count().alias("missing_pupil"),
				pl.col("heart_explore").null_count().alias("missing_heart"),
			),
			on=split_keys,
			how="left",
		)
		.join(
			samples.group_by(*split_keys).agg(
				pl.col("trueID").n_unique().alias("participants"),
				pl.len().alias("records"),
			),
			on=split_keys,
			how="left",
		)
		.with_columns(pl.exclude(split_keys).fill_null(0))
		.sort(*split_keys)
	)
	return samples, counts


def cv_row(feature_set, model, params, fold_rmse):
	return {
		"feature_set": feature_set,
		"model": model,
		"alpha": params.get("regressor__alpha"),
		"l1_ratio": params.get("regressor__l1_ratio"),
		"mean_cv_rmse": float(np.mean(fold_rmse)),
		"sd_cv_rmse": float(np.std(fold_rmse)),
		**{f"fold_{i}_rmse": float(rmse) for i, rmse in enumerate(fold_rmse, 1)},
	}


def search_models(feature_set, x, y, folds):
	alpha = np.logspace(-4, 4, 17).tolist()
	specs = [
		(LinearRegression(), "OLS", {}),
		(Lasso(max_iter=10_000), "Lasso", {"regressor__alpha": alpha}),
		(Ridge(), "Ridge", {"regressor__alpha": alpha}),
		(
			ElasticNet(max_iter=10_000),
			"Elastic Net",
			{"regressor__alpha": alpha, "regressor__l1_ratio": [0.1, 0.5, 0.9]},
		),
	]
	grid_rows, finalists = [], []
	for model, name, grid in specs:
		pipeline = Pipeline([("scaler", StandardScaler()), ("regressor", model)])
		search = GridSearchCV(
			pipeline,
			grid,
			cv=folds,
			scoring="neg_root_mean_squared_error",
			refit=False,
			error_score="raise",
		).fit(x, y)
		results = search.cv_results_
		rows = [
			cv_row(
				feature_set,
				name,
				params,
				[-results[f"split{fold}_test_score"][i] for fold in range(len(folds))],
			)
			for i, params in enumerate(results["params"])
		]
		grid_rows.extend(rows)
		finalists.append(
			(pipeline.set_params(**search.best_params_), rows[search.best_index_])
		)
	best_pipeline, best_row = min(finalists, key=lambda item: item[1]["mean_cv_rmse"])
	model_rows = [{**row, "selected": row is best_row} for _, row in finalists]
	return best_pipeline.fit(x, y), model_rows, grid_rows


def fitted_parameters(pipeline, features, selected):
	scale = pipeline.named_steps["scaler"]
	model = pipeline.named_steps["regressor"]
	slopes = model.coef_ / scale.scale_
	return {
		"model": selected["model"],
		"hyperparameters": model.get_params(),
		"intercept": float(model.intercept_ - slopes @ scale.mean_),
		"coefficients": dict(zip(features, slopes.tolist(), strict=True)),
	}


def paired_rmse_gain(predictions):
	"""Resample people within each task, retaining all cycles of each draw."""
	draws = 10_000
	rng = np.random.default_rng(9327)
	resampled = np.zeros((draws, 3))
	for task_rows in predictions.partition_by("task", maintain_order=True):
		people = (
			task_rows.group_by("trueID")
			.agg(
				pl.len().alias("records"),
				((pl.col("actual") - pl.col("predicted_history_only")) ** 2)
				.sum()
				.alias("history_sse"),
				((pl.col("actual") - pl.col("predicted_task3")) ** 2)
				.sum()
				.alias("task3_sse"),
			)
			.sort("trueID")
			.drop("trueID")
			.to_numpy()
		)
		indices = rng.integers(people.shape[0], size=(draws, people.shape[0]))
		resampled += people[indices].sum(axis=1)
	records, history_sse, task3_sse = resampled.T
	gain = np.sqrt(history_sse / records) - np.sqrt(task3_sse / records)
	lower, upper = np.quantile(gain, [0.025, 0.975])
	return float(lower), float(upper)


def run(output):
	samples, counts = build_samples()
	train = samples.filter(pl.col("split") == "train")
	validation = samples.filter(pl.col("split") == "validation")
	y = train["actual"].to_numpy()
	actual = validation["actual"].to_numpy()
	folds = list(GroupKFold(n_splits=FOLDS).split(y, groups=train["trueID"].to_numpy()))
	fold_ids = np.empty(len(train), dtype=int)
	for i, (_, indices) in enumerate(folds, 1):
		fold_ids[indices] = i
	samples = samples.join(
		train.select("task", "trueID", "cycle").with_columns(
			pl.Series("cv_fold", fold_ids)
		),
		on=["task", "trueID", "cycle"],
		how="left",
		validate="1:1",
		maintain_order="left",
	)

	previous = train["previous_performance"].to_numpy()
	baseline = cv_row(
		BASELINE,
		BASELINE,
		{},
		[root_mean_squared_error(y[test], previous[test]) for _, test in folds],
	)
	summary = [{**baseline, "selected": True}]
	grid = []
	parameters = {}
	fitted_models = {}
	predictions = validation.select(
		"task", "trueID", "half", "cycle", "screen", "actual"
	)
	predictions = predictions.with_columns(
		validation["previous_performance"].alias("predicted_previous_cycle")
	)
	for feature_set, features in FEATURES.items():
		fitted, scores, trials = search_models(
			feature_set, train.select(features).to_numpy(), y, folds
		)
		fitted_models[feature_set] = fitted
		summary.extend(scores)
		grid.extend(trials)
		selected = next(row for row in scores if row["selected"])
		parameters[feature_set] = fitted_parameters(fitted, features, selected)
		predicted = fitted.predict(validation.select(features).to_numpy())
		predictions = predictions.with_columns(
			pl.Series(f"predicted_{feature_set}", predicted)
		)

	metrics = {}
	for feature_set in [BASELINE, *FEATURES]:
		predicted = predictions[f"predicted_{feature_set}"].to_numpy()
		metrics[feature_set] = {
			"feature_set": feature_set,
			"model": parameters[feature_set]["model"]
			if feature_set in parameters
			else BASELINE,
			"rmse": root_mean_squared_error(actual, predicted),
			"mae": mean_absolute_error(actual, predicted),
			"r2": r2_score(actual, predicted),
		}
	lower, upper = paired_rmse_gain(predictions)
	comparison = {
		"rmse_gain": float(metrics["history_only"]["rmse"])
		- float(metrics["task3"]["rmse"]),
		"ci_95_lower": lower,
		"ci_95_upper": upper,
	}

	output.mkdir(parents=True, exist_ok=True)
	counts.write_csv(output / "sample_counts.csv")
	samples.write_csv(output / "samples.csv")
	pl.DataFrame(summary).write_csv(output / "cv_summary.csv")
	pl.DataFrame(grid).write_csv(output / "cv_grid.csv")
	pl.DataFrame(list(metrics.values())).write_csv(output / "validation_metrics.csv")
	pl.DataFrame([comparison]).write_csv(output / "validation_comparison.csv")
	predictions.write_csv(output / "validation_predictions.csv")
	(output / "model_parameters.json").write_text(
		json.dumps(parameters, indent=2) + "\n", encoding="utf-8"
	)
	with (output / "task3_model.pkl").open("wb") as model_file:
		pickle.dump(
			fitted_models["task3"], model_file, protocol=pickle.HIGHEST_PROTOCOL
		)
	print(f"{train.height} training records, {validation.height} validation records")
	print(pl.DataFrame(list(metrics.values())))
	print(
		f"Validation RMSE gain from pupil size: {comparison['rmse_gain']:.3f} [{lower:.3f}, {upper:.3f}]"
	)


if __name__ == "__main__":
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("--output", type=Path, default=ROOT / "output" / "task3")
	run(parser.parse_args().output)
