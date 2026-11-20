# BCAI4 Workshop 4.2

## Schema-based learning and decision making

Gedi Lukšys – October 9, 2026 (to be continued online on October 23, 2026)

## Goals

- Get acquainted to the schema task

- Come up with interesting questions and good hypotheses for the schema experiment

- Practice analysis of learning curves from the schema experiment

## Today’s workshop plan

At first, you perform the schema-based learning and decision making tasks (either paintings or quotes), as in the real experiment (14:00 - 15:50).

Then we discuss how to analyse data from previous years’ ZJE students in a similar raw data format as you collect today - you could have a look at its analysis: it’s described in a separate Learn post (15:50 - 16:20).

Finally we will focus on analysing summary data from the actual experiments run in Edinburgh between 2019 and 2020. The format is different from raw data, but raw data can always be converted into summary data: if you have problems with doing that, please let me know (16:20 - 16:50).

For the analyses, you’re not expected to complete them today, only to understand how to do them and ask any relevant questions. You should continue with analyses independently / in groups until October 23 online workshop.

You can also read the following description, particularly relevant for the last part:

In the schema task participants learn schemas of different painters or authors during exploration phases which they later have to use to identify 4 items belonging to the same person out of 20 in the decision phase. Exploration and decision phases alternate; exploration phases last for at least 3 min (except the first, which lasts for 10 min) until the participant chooses “proceed to the decision phase”. Similarly, there is no time limit to the decision phase – participants have as much time as they need; however, the total session time is limited to 90 min, including the break of 5 min, which starts after finishing the first decision phase after 35 min, and reward is given per each decision screen – 2-6p per selected item, based on the payoff of the selected schema, multiplied by a bonus of 3 if participants select all 4 items from the same author. In low-risk condition participants also get a bonus multiplier of 2 if they choose only 3 out of 4 items from the same author. There are 6 groups: Hc and Lc (control groups of high or low risk respectively), HL and LH (groups of risk condition changing from high-to-low or low-to-high after the break), and H and L (groups where 5 out of 10 schemas are replaced with novel ones after the break, which participants have to learn newly, with high or low risk respectively). Hence, we are effectively varying 3 factors: risk, change of risk after the break, and novelty, in addition to employing schemas with different payoffs.

The experimental summary data from Edinburgh is provided in the files paintings.csv and quotes.csv

In these analyses we focus on decision phase performance, although exploration phase performance can be made available as well upon request if your group would like to investigate it for the group project. Background questionnaire data is also available, if you’d like to include it in your analyses. In the provided files, one line is given for each participant and each decision screen. The columns have the following information:

- ID: participant ID – note that participants for quotes and paintings are different.

- Round: decision round number – note that the number of rounds vary between participants depending on how fast they respond with the total time set to 75 min.

- Time: time of each round in the relative scale of 0 (start of the experiment) and 1 (end of the experiment, usually 75 min).

- Risk: risk condition, 1 for high and 0 for low. In HL and LH conditions it changes after the break.

- Change: change in risk – it is always 0 before the break, but after the break it’s -1 for high-to-low risk transition, 1 for low-to-high risk transition and 0 for all other groups.

- Novelty: 1 if novelty is introduced (only after the break for participants in L and H groups, 0 for all other cases)

- Payoff: pennies participants get for each screen: from the minimum of 2+2+2+3 = 9p in high risk-condition to a maximum of (6+6+6+6) x 3 = 72p if selecting all 4 items from the same 6p schema.

- Performance: adjusted payoff – same as payoff under low risk, which under high risk is recalculated as if the participant did the experiment in low risk, so that direct comparison between low and high risk performance could be performed.

- AEPpayoff: average expected performance in all previous rounds based on payoff, i.e. without recent adjustments. It gives a clue to how well participants think they are doing in the task, which may influence their future performance.

- RPE: ‘reward prediction error’ – difference between the payoff and AEP in the previous round – it gives participant a clue about how well they performed in the last round compared to previously and may indicate recent performance improvement or deterioration. Positive RPE signals recently improved performance, whereas negative RPE recently deteriorated performance.

- DecBias: average value of the items selected by the participant in that round, without considering any bonus, so e.g. 2, 2, 2, 3 lead to 2.75 and 5, 5, 5, 5 lead to 5, whereas 4, 4, 6, 6, also lead to 5. This indicates if participants prefer lower valued (presumably easier) schemas or higher valued (presumably harder, but also more rewarding) schemas, with 4 indicating neutral selection.

- AC: accuracy, indicating how well participants perform in identifying all 4 items from the same schema. 1 if all items chosen from the same schema, 0.5 if 3 out of 4 items chosen from the same schema and 0 otherwise.

In this workshop your main aim to get acquainted to the data and the ways we can analyse the learning curves. There are various methods to analyse the learning curves, with mixed effects model you learned in IBMS3 being the most common.

To measure learning, you expect to see improvement with time, hence time should be one of the factors. However, there are various ways to represent time, e.g. based on absolute time as determined by the time measure, based on round number, which may indicate experience or even, if you have exploration data available, by the number of times (or other derived measures) participants have seen the relevant schema. You may want to think about differences between different measures of experience and what exactly they indicate. Note that change with time only indicates relative not absolute improvement in learning. For absolute evaluation you may want to compute random performance (e.g. by letting people choose random items) and compute performance accordingly. Then you can compare if your performance is substantially better than expected by chance (with no learning). You could also evaluate learning curves and perform absolute comparisons for the other measures, such as accuracy or decision bias. For decision bias the chance level is obvious (4), for accuracy it’s more complicated, but perhaps not as complicated without including the bonus. You can try to compute this theoretically (using math) or empirically (using simulations).

Comparison between groups can be done using performance, not payoff, so that low risk condition doesn’t get an inherent advantage (other measures are fine, but regarding accuracy, one needs to consider that under high risk participants don’t have particular motivation to choose 3 items out of 4 from the same schema, if they fail to get 4). Perhaps the best way to analyse is to include several of these factors in the mixed model, that would get their timing right, as for example in the novelty group novelty only starts after the break, so comparisons before the break shouldn’t indicate difference but one needs to be mindful of interactions.

The cases of prior performance feedback (AEPpayoff and RPE) are also interesting. Prior performance (both average and recent) can influence perception of participants’ performance in the experience, hence change their motivation, attention, stress and other factors and thereby influence their further learning. For example, possible hypotheses could be participants getting encouraged by good performance, discouraged by poor performance; on the contrary, they may react to last session performance (RPE) in an opposite way: success may lead to relaxation and poorer performance in the next session, whereas failure may lead to them paying more attention in the next session. There could also be various sequential effects, e.g. with participants choosing the same payoff that worked. When analysing effects of prior performance, it’s important to dissociate them from the effects of time. As with time participants learn, if prior performance is included in the predictive model instead of time, it’s positive association simply reflects the fact that with time participants learn, not that prior performance facilitates their learning. Whereas if prior performance is included in addition to time or round number, and is still significant, this may suggest a facilitatory effect of performance as opposed to merely effects of learning with time. Think about the best ways to analyse and visualise this. We also have new data (for the paintings task only) where we manipulate performance feedback experimentally. If your group chooses this project and you’d like to explore this topic, I could provide you this data.

Another important thing to note when considering effects of modulators such as novelty, risk and risk change is their timing. Introduction in the middle of the experiment suggests that they affect learning in the intermediate phase, which however may differ between participants: some participants may learn the task much faster and already consolidate it well by this point, whereas others may still be in initial stages of learning. You may want to consider such interactions when evaluating the effects of these modulators, as they may change quite considerably depending on the learning phase.

Overall, although we expect you to perform some data analyses, in this workshop the main focus is on getting acquainted with the data, coming up with good questions, hypotheses and their justifications, and then thinking about the best ways to address them. Do not rush with analyses without thinking through what these analyses should be (both conceptually and statistically).
