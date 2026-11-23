# Task 3 此前表现与当前探索阶段瞳孔预测表现

Paintings和Quotes联合建模。按训练集分组交叉验证选出的Lasso在固定验证集上的RMSE为17.223、MAE为14.292、R²为0.165。瞳孔系数被收缩为0，182条验证预测均与同样本的纯历史模型相同。这组数据和建模方案下，加入瞳孔没有降低预测误差

## 复现

先安装uv，再在仓库根目录同步锁定的依赖，项目开发依赖包含ty和Ruff。分析使用仓库已跟踪的6张行为及生理汇总表。[uv安装说明](https://docs.astral.sh/uv/getting-started/installation/)

```sh
uv sync --locked
uv run --locked src/task3.py
uv run --locked ruff check src/task3.py
uv run --locked ty check src/task3.py
```

结果生成至`output/task3/`，可用`--output`指定其他目录。分析代码见[src/task3.py](../src/task3.py)

## 样本与特征

一个探索周期有两个后续决策屏幕。生理表的`round`为周期号，对应行为表第`2 × cycle − 1`及第`2 × cycle`屏。以行为表第一屏的`performance`为预测目标。按`trueID`、周期、休息分段及实验条件对齐表格，仅保留两项生理数据均有有限`phase=0`值的预测周期。Quotes心率表中有9条探索记录的实验条件与行为表不一致，均位于休息后首轮，因历史重置而没有进入候选样本。[实验流程](../experiment/experiment_guide.md) · [Workshop 6](../experiment/BCAI4%20Workshop%206%20EN.md)

| 模型输入 | 定义 |
| --- | --- |
| `previous_performance` | 同一休息分段内，上一周期第一屏的`performance` |
| `history_mean` | 同一休息分段内，此前所有周期第一屏的`performance`均值 |
| `pupil_explore` | 当前探索阶段的瞳孔中位值，源表已减去该参与者最初10分钟的平均值 |

历史从行为表先计算，再做生理数据筛选，所以此前任何有行为得分的周期都能提供历史，包括各段首轮和缺少生理读数的轮次。两段各自从第2轮产生样本。心率仅用于确定四项任务的共有样本。沿用任务分工中的固定`trueID`名单，全部88人均有入模记录

| 实验 | 数据集 | 人数 | 候选周期 | 缺瞳孔 | 缺心率 | 入模记录 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Paintings | 训练 | 28 | 363 | 2 | 69 | 292 |
| Paintings | 验证 | 8 | 97 | 0 | 11 | 86 |
| Quotes | 训练 | 41 | 373 | 0 | 8 | 365 |
| Quotes | 验证 | 11 | 103 | 0 | 7 | 96 |
| 合计 | 训练 | 69 | 736 | 2 | 77 | 657 |
| 合计 | 验证 | 19 | 200 | 0 | 18 | 182 |

## 训练集交叉验证

按`trueID`做5折`GroupKFold`。所有模型用相同的折，`StandardScaler`只用各折训练部分拟合。Lasso、Ridge和Elastic Net的`alpha`取从10⁻⁴到10⁴的17个等对数间隔值。Elastic Net的`l1_ratio`取0.1、0.5、0.9。按5折RMSE的算术平均值选超参数和模型，随后在全部训练样本上重新拟合。纯历史对照沿用同一批样本、折与历史特征，可在小组完成Task 1后核对口径

| 模型 | Task 3最优参数 | Task 3 CV RMSE | 纯历史最优参数 | 纯历史 CV RMSE |
| --- | --- | ---: | --- | ---: |
| OLS | 默认 | 16.7333 | 默认 | 16.7191 |
| Lasso | α=0.316228 | **16.6723** | α=0.316228 | **16.6703** |
| Ridge | α=31.622777 | 16.7206 | α=31.622777 | 16.7057 |
| Elastic Net | α=0.316228，`l1_ratio=0.9` | 16.6895 | α=0.316228，`l1_ratio=0.9` | 16.6863 |

直接使用上一周期第一屏表现的基准，其5折平均RMSE为20.4539

## 固定验证集

| 模型 | RMSE | MAE | R² |
| --- | ---: | ---: | ---: |
| 直接使用上一周期表现 | 20.330 | 15.187 | −0.163 |
| 纯历史Lasso | 17.223 | 14.292 | 0.165 |
| Task 3 Lasso | 17.223 | 14.292 | 0.165 |

Task 3最终Lasso的`alpha=0.316227766`。换回原始特征尺度后，截距为16.897015，`previous_performance`系数为0.034579，`history_mean`系数为0.556789，`pupil_explore`系数为0

纯历史RMSE减去Task 3 RMSE得到改善量0.000。按实验分层，以参与者为单位配对重采样10,000次，RMSE改善量的95%百分位区间为[0.000, 0.000]。区间退化对应两套已拟合模型在验证记录上的逐条预测一致，结果适用于本次特征和模型

## 加载已拟合模型

`task3_model.pkl`包含训练集上拟合的`StandardScaler`和Lasso。输入原始尺度的数据，列顺序为`previous_performance`、`history_mean`、`pupil_explore`。在仓库根目录运行以下示例

```sh
uv run --locked python - <<'PY'
import pickle

with open("output/task3/task3_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

print(model.predict([[40.0, 36.5, 0.8]])[0])
PY
```

## 输出文件

| 文件 | 内容 |
| --- | --- |
| `samples.csv` | 四项任务可共用的周期记录、训练或验证标签、训练折与三类数据 |
| `sample_counts.csv` | 实际人数、候选周期、缺失数与入模记录数 |
| `cv_summary.csv` | 各模型最佳参数、每折RMSE、平均值及标准差 |
| `cv_grid.csv` | 所有候选参数及交叉验证结果 |
| `task3_model.pkl` | 可直接调用`predict`的Task 3模型，包含特征标准化 |
| `model_parameters.json` | 两个最终模型的超参数、原尺度截距与系数 |
| `validation_metrics.csv` | 固定验证集RMSE、MAE与R² |
| `validation_comparison.csv` | 同样本瞳孔增量及配对区间 |
| `validation_predictions.csv` | 每条验证记录的`trueID`、周期、屏幕、实际值和三组预测值 |
