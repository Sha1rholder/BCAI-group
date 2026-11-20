(() => {
"use strict";
const root = document.getElementById("root");
const status = (function createDataStatus(root, { version = "unknown", surface = "chart" } = {}) {
  const doc = root.ownerDocument;
  const layer = root.querySelector("[data-data-status]") ?? doc.createElement("div");
  layer.setAttribute("data-data-status", "");
  if (!layer.parentNode) root.append(layer);
  const redact = value => String(value ?? "")
    .slice(0, 12_000)
    .replace(/https?:\/\/[^\s)]+/giu, url => "[url]" + (url.match(/(?::\d+){1,2}$/u)?.[0] ?? ""))
    .replace(/(?:file:\/\/)?\/(?:Users|home|root|private|tmp|var)\/[^\s):]+/gu, "[path]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email]")
    .replace(/\b(?:bearer\s+|(?:token|api[_-]?key|password|secret|authorization)\s*[:=]\s*)[^\s,;]+/giu, "[credential]")
    .replace(/(["'`])[^\n]*?\1/gu, "[quoted value]")
    .slice(0, 4000);
  return {
    ready() {
      layer.remove();
      root.removeAttribute("aria-busy");
    },
    fail(error, stage = "render") {
      if (!layer.parentNode) root.append(layer);
      root.removeAttribute("aria-busy");
      layer.hidden = false;
      layer.setAttribute("role", "alert");
      layer.setAttribute("data-data-status", "error");
      const title = doc.createElement("p");
      title.textContent = "An error occurred inside the visualization.";
      const button = doc.createElement("button");
      button.type = "button";
      button.textContent = "Copy error logs";
      const hint = doc.createElement("p");
      hint.setAttribute("role", "status");
      const logs = JSON.stringify({
        source: "data-plugin", version, surface, stage,
        timestamp: new Date().toISOString(),
        error: { name: redact(error?.name ?? "Error").slice(0, 128), message: redact(error?.message ?? error).slice(0, 1500),
          stack: redact(error?.stack).split("\n").slice(0, 9).join("\n") },
      }, null, 2);
      // Deliberately exclude chart configuration, reviewed rows, HTML and page URLs.
      const text = doc.createElement("textarea");
      text.readOnly = true;
      text.hidden = true;
      text.value = logs;
      text.setAttribute("aria-label", "Error logs");
      button.addEventListener("click", async () => {
        try {
          const clipboard = doc.defaultView?.navigator?.clipboard;
          if (!clipboard?.writeText) throw new Error("Clipboard unavailable");
          await clipboard.writeText(logs);
          hint.textContent = "Error logs copied.";
        } catch {
          text.hidden = false;
          hint.textContent = "Select and copy the error logs below.";
          text.focus();
          text.select();
        }
      });
      layer.replaceChildren(title, button, hint, text);
    },
  };
})(root,{"surface":"report"});
let stage="runtime";
try {
const runtime = globalThis.CodexDataAppRuntime;
if (runtime?.apiVersion !== 1) throw new Error("The embedded dashboard runtime could not load. Rebuild this dashboard.");
stage="data";
if (typeof schemaLearningSnapshot === "undefined") throw new Error("The bundled report data could not load.");
const reviewedSnapshot = schemaLearningSnapshot;
runtime.mount({reviewedSnapshot, hosted: false, staticDemo: true, createContent: (snapshot) => (function(__dataAuthoredRuntime, __dataAuthoredSnapshot) {
"use strict";
const __dataAuthoredData = Object.create(null);
Object.defineProperty(__dataAuthoredData, "__esModule", {value:true});
Object.defineProperty(__dataAuthoredData, "default", {enumerable:true, value:__dataAuthoredSnapshot});
if (__dataAuthoredSnapshot && typeof __dataAuthoredSnapshot === "object") for (const __dataAuthoredKey of Object.keys(__dataAuthoredSnapshot)) {
if (__dataAuthoredKey !== "default" && __dataAuthoredKey !== "__esModule" && __dataAuthoredKey !== "__proto__") Object.defineProperty(__dataAuthoredData, __dataAuthoredKey, {enumerable:true, get:()=>__dataAuthoredSnapshot[__dataAuthoredKey]});
}
Object.freeze(__dataAuthoredData);
const __dataAuthoredAllowed = new Set(JSON.parse("[\"@openai/data-app\",\"react\",\"react-dom\",\"react-dom/client\",\"react-markdown\",\"react/jsx-dev-runtime\",\"react/jsx-runtime\",\"recharts\"]"));
function __dataAuthoredRequire(id) {
if (id === "@openai/data-app-reviewed-snapshot") return __dataAuthoredData;
if (__dataAuthoredAllowed.has(id) && __dataAuthoredRuntime?.modules && Object.prototype.hasOwnProperty.call(__dataAuthoredRuntime.modules,id)) return __dataAuthoredRuntime.modules[id];
throw new Error("Missing bundled Data runtime module: " + id);
}
for (const [__dataAuthoredKey, __dataAuthoredWanted] of JSON.parse("[[\"react/jsx-runtime\",[\"Fragment\",\"__esModule\",\"default\",\"jsx\",\"jsxs\"]],[\"react\",[\"Activity\",\"Children\",\"Component\",\"Fragment\",\"Profiler\",\"PureComponent\",\"StrictMode\",\"Suspense\",\"__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE\",\"__COMPILER_RUNTIME\",\"__esModule\",\"cache\",\"cacheSignal\",\"cloneElement\",\"createContext\",\"createElement\",\"createRef\",\"default\",\"forwardRef\",\"isValidElement\",\"lazy\",\"memo\",\"startTransition\",\"unstable_useCacheRefresh\",\"use\",\"useActionState\",\"useCallback\",\"useContext\",\"useDebugValue\",\"useDeferredValue\",\"useEffect\",\"useEffectEvent\",\"useId\",\"useImperativeHandle\",\"useInsertionEffect\",\"useLayoutEffect\",\"useMemo\",\"useOptimistic\",\"useReducer\",\"useRef\",\"useState\",\"useSyncExternalStore\",\"useTransition\",\"version\"]],[\"@openai/data-app\",[\"Button\",\"Chart\",\"ChartEditor\",\"ChartMark\",\"ChartRenderer\",\"ChartTooltip\",\"ContainedDialog\",\"DataComponent\",\"DataTable\",\"DateRangePicker\",\"Dialog\",\"Dropdown\",\"EditableText\",\"EvidenceChart\",\"ExecutiveSummary\",\"Filters\",\"Icon\",\"InfoTooltip\",\"InlineFilters\",\"Menu\",\"MenuGroup\",\"MenuItem\",\"MenuSeparator\",\"MenuSub\",\"MetricCard\",\"MetricCardTabs\",\"MetricSparkline\",\"NativeSelect\",\"QueryDataBoundary\",\"RangeSlider\",\"ReportSection\",\"RichNarrative\",\"Section\",\"SectionHeader\",\"SectionNavigator\",\"SegmentedControl\",\"Slider\",\"SortableItem\",\"SortableRegion\",\"SourceInspector\",\"SourceSidebar\",\"Switch\",\"TabPanel\",\"Table\",\"Tabs\",\"Tooltip\",\"TruncatedText\",\"__esModule\",\"barChartSpec\",\"chartConfigEntries\",\"chartDataShape\",\"chartSpecKeys\",\"compact\",\"default\",\"displayValue\",\"groupAdditiveCategories\",\"label\",\"normalizeChartAnnotations\",\"percentage\",\"periodComparison\",\"previousPeriodRows\",\"projectChartSpec\",\"resolveChartAnnotations\",\"semanticColorResolver\",\"shortDate\",\"useDashboardTabs\",\"useDataApp\",\"useSectionFilters\"]]]")) {
const __dataAuthoredNamespace = __dataAuthoredRequire(__dataAuthoredKey);
for (const name of __dataAuthoredWanted) if (!Object.prototype.hasOwnProperty.call(__dataAuthoredNamespace,name)) throw new Error("Missing bundled Data export " + name + " from " + __dataAuthoredKey);
}
const __dataAuthoredModule = {exports:Object.create(null)};
(function(module,exports,require){
'use strict';

var jsxRuntime = require('react/jsx-runtime');
var react = require('react');
var dataApp = require('@openai/data-app');

// The shared app imports both entrypoints. Keep the inactive dashboard empty.
function DashboardContent() { return null; }

function assertDataViewSchema(schema) {
  for (const [query, contract] of Object.entries(schema)) {
    for (const field of contract.breakdown ?? [])
      if (!Object.hasOwn(contract.columns, field)) throw new Error(`Data view: ${query} breakdown has no declared ${field} field.`);
  }
}

function assertReviewedRows(query, contract, rows) {
  if (!Array.isArray(rows)) throw new Error(`Data view: ${query} has no loaded reviewed rows.`);
  const fields = Object.entries(contract.columns);
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`Data view: ${query} row ${index + 1} is not a record.`);
    for (const [field, column] of fields) {
      const definition = typeof column === "string" ? { type: column } : column;
      const value = row[field];
      if (value === undefined && definition.optional || value === null && definition.nullable) continue;
      const valid = value !== undefined && value !== null && (definition.type === "unknown" || (definition.type === "date"
        ? typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
          && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
        : typeof value === definition.type && (definition.type !== "number" || Number.isFinite(value))));
      if (!valid) throw new Error(`Data view: ${query}.${field} row ${index + 1} must be ${definition.type}${definition.nullable ? " or null" : ""}.`);
    }
  }
}

function assertFilterFields(schema, filters) {
  for (const filter of filters) {
    for (const [query, contract] of Object.entries(schema)) {
      if ((!filter.queryIds || filter.queryIds.includes(query)) && !Object.hasOwn(contract.columns, filter.field))
        throw new Error(`Data view: filter ${filter.id} targets ${query}, which has no ${filter.field} field. Declare its queryIds or correct the contract.`);
    }
  }
}

;


const EvidenceContext = react.createContext(null);
/** Existing report citations can join the active scope without knowing its schema. */
function useDataViewEvidence(query) {
  return react.useContext(EvidenceContext)?.(query);
}

const boundProps = ["queryId", "queryIds", "sourceRows", "displayRows", "scopeFilters", "sourceRowsByQuery", "sectionFilters"] ;

function componentProps(props) {
  const conflict = boundProps.find(key => Object.hasOwn(props, key));
  if (conflict) throw new Error(`Data view: ${conflict} is supplied by the active query scope.`);
  return props;
}




















/** Initialize once at module scope. The shell remains the sole owner of view state. */
function createDataView(schema) {
  assertDataViewSchema(schema);
  









  const Context = react.createContext(null);
  // Query updates replace row arrays. Share validation across components/scopes,
  // but never reuse it for a refreshed array or another query contract.
  const checked = new Map();
  const ids = Object.keys(schema);

  function useView() {
    const view = react.useContext(Context);
    if (!view) throw new Error("Data view components must be inside View.Provider.");
    return view;
  }
  function useQuery(query) { return useView().resolve(query); }
  
  function useEvidence(query, evidenceQueries = []) {
    const { resolve } = useView();
    if (!Array.isArray(evidenceQueries)) throw new Error("Data view: evidenceQueries must be an array of reviewed query names.");
    const primary = resolve(query);
    const queryIds = [...new Set([query, ...evidenceQueries])];
    if (queryIds.length === 1) return primary;
    const bindings = queryIds.map(id => resolve(id));
    const filters = new Map();
    for (const binding of bindings) {
      for (const filter of binding.scopeFilters) {
        const key = JSON.stringify([filter.field, filter.label, filter.value]);
        const previous = filters.get(key);
        filters.set(key, { ...filter, queryIds: [...(previous?.queryIds ?? []), binding.queryId] });
      }
    }
    return { ...primary, queryIds, scopeFilters: [...filters.values()],
      sourceRowsByQuery: Object.fromEntries(bindings.map(binding => [binding.queryId, binding.sourceRows])) };
  }

  function Scope({ children, section }) {
    const app = dataApp.useDataApp();
    const parent = react.useContext(Context);
    if (section && (!parent || parent.section)) throw new Error("View.Section belongs directly within a View.Provider scope; nested section scopes are not supported.");
    const local = dataApp.useSectionFilters(section?.filters ?? [], section?.initialValues ?? {}, section ? { id: section.id, label: section.label } : undefined);
    const visibleFilterIds = app.snapshot.report?.visibleFilterIds ?? app.snapshot.visibleReportFilters;
    const definitions = (app.snapshot.filters ?? []).filter(filter => app.snapshot.surface !== "report"
      || filter.visible === true || filter.reportVisible === true || filter.surface === "report"
      || filter.surfaces?.includes("report") || (Array.isArray(visibleFilterIds) && visibleFilterIds.includes(filter.id)));
    const explicitVisibility = Array.isArray(visibleFilterIds) || (app.snapshot.filters ?? []).every(filter =>
      filter.visible !== undefined || filter.reportVisible !== undefined || filter.surface !== undefined || filter.surfaces !== undefined);
    if (section && app.snapshot.surface === "report" && definitions.length !== (app.snapshot.filters ?? []).length)
      throw new Error("Data view: remove hidden report filter definitions before adding a section scope.");
    assertFilterFields(schema, [...definitions, ...(section?.filters ?? [])]);
    const resolved = new Map();
    const resolve = (query) => {
      if (!Object.hasOwn(schema, query)) throw new Error(`Data view: unknown query ${query}.`);
      const cached = resolved.get(query);
      if (cached) return cached ;
      const contract = schema[query];
      const original = app.queries[query]?.rows;
      const seen = checked.get(query) ?? new WeakSet();
      if (!original || !seen.has(original)) {
        assertReviewedRows(query, contract, original);
        seen.add(original); checked.set(query, seen);
      }
      // Keep the declared grain/history in every consumer. Authors decide their
      // aggregation explicitly; chart and metric selection do not change scope.
      const breakdown = contract.breakdown ?? Object.keys(contract.columns);
      const pageRows = section ? undefined : app.reviewedRows(query, breakdown);
      // The shell adds page filters to Sources/export metadata. Only local
      // filters belong in scopeFilters, otherwise page labels appear twice.
      const selected = section ? local.componentProps(query, breakdown) : {
        displayRows: pageRows, sourceRows: pageRows, scopeFilters: [],
      };
      const result = { ...selected, queryId: query, rows: selected.displayRows } ;
      resolved.set(query, result); return result;
    };
    return jsxRuntime.jsx(EvidenceContext.Provider, { value: query => resolve(query ), children: jsxRuntime.jsx(Context.Provider, { value: { resolve, section: Boolean(section),
      hiddenReportFilters: !section && app.snapshot.surface === "report" && !explicitVisibility && Boolean(app.snapshot.filters?.length) && !definitions.length,
      filters: section ? local.filterProps : {
      filters: definitions, queries: app.queries, values: app.filters, onChange: app.setFilter,
    } }, children: children})});
  }
  function Provider({ children }) {
    return jsxRuntime.jsx(dataApp.QueryDataBoundary, { queryIds: ids, children: jsxRuntime.jsx(Scope, { children: children})});
  }
  function Section({ children, ...section }) {
    return jsxRuntime.jsx(Scope, { section: section, children: children});
  }
  function ViewFilters({ sticky = false, ariaLabel, clearLabel, showClear, trailingControls, children }
) {
    const view = useView();
    if (view.hiddenReportFilters)
      throw new Error("Data view: View.Filters has no visible report filters. Set report.visibleFilterIds in src/data.json to the intended filter IDs (or set visible: true on those definitions). Remove View.Filters if this report should have no filter controls.");
    return jsxRuntime.jsx(dataApp.Filters, { ...view.filters, sticky: !view.section && sticky, ariaLabel: ariaLabel ?? view.filters.ariaLabel,
      clearLabel: clearLabel, showClear: showClear ?? view.filters.showClear, trailingControls: trailingControls, children: children});
  }
  






  function Chart({ query, evidenceQueries, select, spec, id, title, summary, description, height, ...props }

) {
    const { rows, ...evidence } = useEvidence(query, evidenceQueries);
    try {
      const config = { schemaVersion: 1 , id, title, summary, description, height: height ?? undefined,
        spec, rows: [...(select ? select(rows) : rows)] };
      return jsxRuntime.jsx(dataApp.EvidenceChart, { ...componentProps(props), ...evidence, config: config,} );
    } catch (error) {
      return jsxRuntime.jsx('div', { role: "alert", 'data-chart-config-error': "true", children: error instanceof Error ? error.message : String(error)});
    }
  }
  

  function Metric({ query, evidenceQueries, value, trendValues, trendLabel, periodLabel, periodDescription, ...props }




) {
    const { rows, ...evidence } = useEvidence(query, evidenceQueries);
    return jsxRuntime.jsx(dataApp.MetricCard, { ...componentProps(props), ...evidence, value: value(rows),
      trendValues: typeof trendValues === "function" ? trendValues(rows) : trendValues,
      trendLabel: typeof trendLabel === "function" ? trendLabel(rows) : trendLabel,
      periodLabel: typeof periodLabel === "function" ? periodLabel(rows) : periodLabel,
      periodDescription: typeof periodDescription === "function" ? periodDescription(rows) : periodDescription,} );
  }
  




  function Table({ query, evidenceQueries, columns, table, ...props }

) {
    const { rows, ...evidence } = useEvidence(query, evidenceQueries);
    return jsxRuntime.jsx(dataApp.DataComponent, { ...componentProps(props), ...evidence, kind: "table", children: jsxRuntime.jsx(dataApp.DataTable, { ...table, rows: rows,
      columns: columns ?? Object.keys(schema[query].columns).map(field => ({ field })),} )});
  }
  function Block({ query, evidenceQueries, children, ...props }

) {
    const { rows, ...evidence } = useEvidence(query, evidenceQueries);
    return jsxRuntime.jsx(dataApp.DataComponent, { kind: "custom", ...componentProps(props), ...evidence, children: children(rows)});
  }
  return { Provider, Section, Filters: ViewFilters, Chart, Metric, Table, Block, useQuery };
}

/** Use the same ordered query IDs for the citations and the report's source list.
 * @param {{ queryIds: readonly string[], queryId: string, showTitle?: boolean,
 * sourceRows?: readonly import("../../data-app-public.jsx").DataRow[] }} props */
function ReportCitation({ queryIds, queryId, showTitle = false, sourceRows }) {
  const { queries, componentActions } = dataApp.useDataApp();
  const scopedEvidence = useDataViewEvidence(queryId);
  const index = queryIds.indexOf(queryId);
  const query = queries[queryId];
  if (index < 0 || !query) throw new Error("Unlisted report source: " + queryId);
  const title = query.source?.name || (typeof query.source?.label === "string" && query.source.label) || queryId;
  const number = "[" + (index + 1) + "]";
  return jsxRuntime.jsx('button', { type: "button", 'data-report-citation': showTitle ? "list" : "claim",
    'aria-label': number + " " + title,
    onClick: () => componentActions.onOpen?.("source", {
      id: "source-" + queryId, queryId, title, ...scopedEvidence,
      ...(sourceRows !== undefined ? { sourceRows } : {}),
    }), children: 
    showTitle ? number + " " + title : number
  });
}

/** @param {{ queryIds: readonly string[] }} props */
function ReportSources({ queryIds }) {
  if (!queryIds.length) return null;
  return jsxRuntime.jsxs('section', { className: "study-band study-sources", 'aria-labelledby': "study-sources-heading", children: [
    jsxRuntime.jsx('h2', { id: "study-sources-heading", children: "数据来源"})
    , jsxRuntime.jsx('ol', { children:
      queryIds.map(id => jsxRuntime.jsx('li', { children: jsxRuntime.jsx(ReportCitation, { queryIds: queryIds, queryId: id, showTitle: true,} )}, id))
    })
  ]});
}

/** @param {{preparedOn: string, author?: string}} props */
function ReportHeader({ preparedOn, author }) {
  const { appTitle, setAppTitle, canEdit, mode } = dataApp.useDataApp();
  const editing = canEdit && mode === "edit";
  return jsxRuntime.jsxs('header', { className: "report-hero", children: [
    jsxRuntime.jsx('h1', { 'data-data-app-title': true, contentEditable: editing, suppressContentEditableWarning: true,
      'aria-label': editing ? "Edit report heading" : undefined,
      onBlur: editing ? e => setAppTitle((e.currentTarget.textContent ?? "").trim() || appTitle) : undefined,
      onKeyDown: editing ? e => { if(e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } } : undefined, children: 
      appTitle
    })
    , jsxRuntime.jsx(dataApp.RichNarrative, { id: "report:byline", className: "report-deck", label: "Edit report date and author"    ,
      value: [preparedOn, author].filter(Boolean).join(" · "),} )
  ]});
}

/** Keep the numbered Sources list with the claim citations when changing the body.
 * @param {{sources: readonly string[], preparedOn: string, author?: string, children: React.ReactNode,
 * className?: string, label?: string, beforeHeader?: React.ReactNode}} props */
function ReportFrame({ sources, preparedOn, author, children, className = "", label = "Analytical report", beforeHeader }) {
  return jsxRuntime.jsxs('article', { className: ["report-content", className].filter(Boolean).join(" "), 'aria-label': label, children: [
    beforeHeader
    , jsxRuntime.jsx(ReportHeader, { preparedOn: preparedOn, author: author,} )
    , children
    , jsxRuntime.jsx(ReportSources, { queryIds: sources,} )
  ]});
}

/** A lookup in reviewed report data. Use a separate query for a different display grain.
 * @param {{queryId: string, caption: string,
 * columns?: import("../../data-app-public.jsx").DataTableProps["columns"]}} props */
function ReportTable({ queryId, caption, columns }) {
  const { reviewedRows } = dataApp.useDataApp();
  return jsxRuntime.jsx(dataApp.DataTable, { rows: reviewedRows(queryId), caption: caption, columns: columns, searchable: false,} );
}

/** @typedef {{id: string, title: string, markdown: string, queryIds?: readonly string[],
 * sourceRowsByQuery?: Record<string, readonly import("../../data-app-public.jsx").DataRow[]>}} Finding */
/** @param {Finding & {sources: readonly string[]}} props */
function ReportFinding({ id, title, markdown, sources, queryIds = [], sourceRowsByQuery }) {
  const prose = jsxRuntime.jsx(dataApp.RichNarrative, { id: id + ":body", value: markdown, label: "Edit finding" , className: "report-finding-prose",} );
  const [first] = queryIds;
  if (!first) return prose;
  return jsxRuntime.jsxs(dataApp.ReportSection, { id: id, title: title, queryId: first, queryIds: queryIds, className: "report-finding",
    sourceRowsByQuery: sourceRowsByQuery, showHeading: false, children: [
    prose, " ", queryIds.map(queryId => jsxRuntime.jsx(ReportCitation, { queryIds: sources, queryId: queryId,
      sourceRows: sourceRowsByQuery?.[queryId],}, queryId ))
  ]});
}

/** @typedef {{queryId: string, config: Omit<import("../../data-app-public.jsx").SingleChart, "rows" | "columns">}} FindingChart */
/** Contextual typing preserves the visualize-data config when authoring reusable chart factories.
 * @param {string} queryId @param {FindingChart["config"]} config @returns {FindingChart} */
function chartFor(queryId, config) {
  return { queryId, config };
}

/** @param {{chart: FindingChart|null}} props */
function ReportChart({ chart }) {
  const { reviewedRows } = dataApp.useDataApp();
  if (!chart) return null;
  const rows = reviewedRows(chart.queryId);
  let resolved;
  try {
    [resolved] = dataApp.chartConfigEntries({ ...chart.config, height: chart.config.height ?? undefined, rows });
  } catch (error) {
    return jsxRuntime.jsx('div', { role: "alert", 'data-chart-config-error': "true", children: error instanceof Error ? error.message : String(error)});
  }
  /** @type {import("../../data-app-public.jsx").ChartOptions & {canonical: boolean, accessibleLabel: string}} */
  const chartOptions = { canonical: true, accessibleLabel: resolved.summary ?? resolved.title };
  return jsxRuntime.jsx(dataApp.EvidenceChart, { queryId: chart.queryId, id: resolved.id, title: resolved.title,
    description: resolved.description ?? undefined, height: resolved.height, spec: resolved.spec,
    rows: resolved.rows, sourceRows: rows, chartOptions: chartOptions,} );
}

const sources = ["effects","alltests","dimensions","links","Paintings","Quotes","clusters","selection","diagnostics","sensitivity","gaze","coverage","same-score"];
function Finding({id, title, children, refs}) {
  return jsxRuntime.jsx(ReportFinding, { id: id, title: title, markdown: "## "+title+"\n\n"+children, sources: sources, queryIds: refs,} );
}
function Table({name,caption,id}) {
  return jsxRuntime.jsx(dataApp.ReportSection, { id: id, title: caption, queryId: name, showHeading: false, children: 
    jsxRuntime.jsx(ReportTable, { queryId: name, caption: caption,} )
  });
}
function Figure({query,title,spec,height=300,description=""}) {
  return jsxRuntime.jsx(ReportChart, { chart: chartFor(query,{id:"plot-"+query,title,spec,height,description}),});
}
function Profile({task, title}) {
  return jsxRuntime.jsx(Figure, { query: task, title: title, height: 285,
    description: "每点一人。横轴为所选项目的平均基础价值，纵轴为识别得分。颜色对应三项指标共同得到的分组",
    spec: {type:"scatter",x:"基础价值",y:"匹配得分",series:"分组",xLabel:"基础价值（便士/项）",yLabel:"同作者匹配得分",xDomain:[2,6],yDomain:[0,1],valueFormat:{style:"decimal",maximumFractionDigits:2}},});
}

const studySections = [
  ["author-switch", "换作者"],
  ["behavior", "行为指标"],
  ["grouping", "分组"],
  ["eye-tracking", "眼动"],
  ["methods", "统计与来源"],
];

function EffectSummary() {
  const { reviewedRows } = dataApp.useDataApp();
  const rows = reviewedRows("effects").filter(row => row["比较"].endsWith(" · 整段"));
  const format = (value, digits = 2) => value.toFixed(digits).replace(/^-/, "−");
  return jsxRuntime.jsxs('figure', { className: "study-effects", children: [
    jsxRuntime.jsx('figcaption', { children: "整段收益改善差（换作者组减保持组，便士/屏）" }),
    jsxRuntime.jsx('dl', { children: rows.map(row => {
      const task = row["比较"].split(" · ")[0];
      return jsxRuntime.jsxs('div', { className: "study-effect", children: [
        jsxRuntime.jsx('dt', { children: task + " · " + row["人数"] + "人" }),
        jsxRuntime.jsx('dd', { className: "study-effect-value", children: format(row["变化差"]) }),
        jsxRuntime.jsxs('dd', { className: "study-effect-note", children: [
          jsxRuntime.jsx('span', { children: "95%区间 " + format(row["下界"]) + "至" + format(row["上界"]) }),
          jsxRuntime.jsx('span', { children: "Holm校正p=" + format(row["校正p"], 3) }),
        ] }),
      ] }, task);
    }) }),
  ] });
}

function ReportDisclosure({ label, children }) {
  return jsxRuntime.jsxs('details', { className: "study-disclosure", children: [
    jsxRuntime.jsx('summary', { children: label }),
    jsxRuntime.jsx('div', { className: "study-disclosure-body", children }),
  ] });
}

function ReportContent() {
  return jsxRuntime.jsxs(ReportFrame, {
    className: "schema-study",
    sources,
    label: "图式学习实验分析报告",
    preparedOn: "图式学习实验 · 绘画91人 · 语句113人 · 5,232个决策屏幕 · 2026年11月20日",
    children: [
      jsxRuntime.jsxs('div', { className: "study-overview", children: [
        jsxRuntime.jsx(Finding, { id: "report-summary", title: "结论摘要", refs: ["effects", "alltests", "diagnostics"], children: `休息后替换10位作者中的5位。两项任务的整段收益改善差均通过Holm校正，差距从哪一屏开始仍不确定

用前半程的匹配、基础价值和决策节奏分组，语句各组的后半程收益有高低梯度，但最佳组数随抽样改变` }),
        jsxRuntime.jsx(EffectSummary, {}),
      ] }),
      jsxRuntime.jsx('nav', { className: "study-nav", 'aria-label': "报告目录", children:
        studySections.map(([id, label]) => jsxRuntime.jsx('a', { href: "#" + id, children: label }, id))
      }),
      jsxRuntime.jsxs('section', { id: "author-switch", className: "study-band study-pair study-result", tabIndex: -1, 'aria-label': "作者替换", children: [
        jsxRuntime.jsx(Finding, { id: "conditions", title: "整段比较的差距最清楚", refs: ["effects", "alltests", "sensitivity"], children: `每屏从20件作品中选出同一作者的4件。所有选择按低风险规则换算为便士。先求每人前后半程的平均收益差，再按相同初始风险比较换作者组与保持组，高低风险各占一半

控制个人起点后，绘画和语句仍分别少改善5.66和7.00便士/屏。分组是否随机尚待核实

图中误差线为单项95%置信区间。只取休息前后各两屏时，两项区间均跨过零。单独切换风险也未通过校正。语句的高转低风险组相对保持高风险组，每屏多改善6.04便士，原始p=0.046，校正后p=0.371` }),
        jsxRuntime.jsx(Figure, { query: "effects", title: "换作者组与保持组的改善差", height: 238,
          description: "负值表示换作者组改善较少。误差线为单项95%置信区间。绘画60人，语句76人",
          spec: { type: "bar", x: "比较", y: "变化差", yLabel: "收益改善差（便士/屏）",
            uncertainty: { style: "bars", lower: "下界", upper: "上界", label: "单项95%置信区间" }, valueDecimals: 2 },
        }),
      ] }),
      jsxRuntime.jsxs('section', { id: "behavior", className: "study-band study-pair", tabIndex: -1, 'aria-label': "行为指标", children: [
        jsxRuntime.jsx(Finding, { id: "dimensions", title: "同样拿36便士，可以有两种选法", refs: ["same-score", "dimensions"], children: `绘画中，272屏配齐4幅同作者作品，平均每幅值3便士。另104屏配中3幅，平均每幅值4.5便士。两种选法的调整后收益均为36便士

**匹配得分（AC）**按4项同作者记1分、3项记0.5分，其余记0分。**基础价值（SB）**为所选4项的均值

两项任务的5,232屏均满足**调整后收益＝4×SB×(1+2×AC)**。聚类时分别使用匹配与价值，以免重复计权。后半程收益留作比较` }),
        jsxRuntime.jsx(Finding, { id: "decision-pace", title: "两屏间隔反映个人节奏", refs: ["dimensions", "links", "alltests"], children: `**决策节奏**按人取同一轮两屏相对时间间隔的中位数。间隔的前后半程排名相关在绘画为0.54，在语句为0.67。连同匹配和基础价值，六项前后相关的校正p均低于0.001

前半程间隔与匹配得分的跨人相关分别只有0.075和0.044。要判断同一个人多花时间时会不会配得更准，需要比较其不同轮次。聚类前对间隔取对数` }),
      ] }),
      jsxRuntime.jsxs('section', { id: "grouping", className: "study-band", tabIndex: -1, 'aria-label': "参与者分组", children: [
        jsxRuntime.jsx(Finding, { id: "profiles", title: "绘画两组收益相近，语句呈现表现梯度", refs: ["Paintings", "Quotes", "clusters", "alltests", "links"], children: `两项任务各自用前半程的三个指标，标准化后以K均值比较2至5组，由最高轮廓系数选组数

绘画中，匹配与基础价值的秩相关为−0.43，语句为+0.13。两批参与者不同，这两个描述性相关不足以判断任务是否造成差异

绘画两组的后半程收益为41.99和43.31便士/屏，校正p=1.00。语句四组依次为27.49、32.68、38.22和44.01便士/屏，校正p=0.000028。后测沿用同一批人，起点和实验条件也可能影响组间差异` }),
        jsxRuntime.jsxs('div', { className: "study-pair study-profiles", children: [
          jsxRuntime.jsx(Profile, { task: "Paintings", title: "绘画｜匹配得分与基础价值" }),
          jsxRuntime.jsx(Profile, { task: "Quotes", title: "语句｜匹配得分与基础价值" }),
        ] }),
        jsxRuntime.jsx(ReportDisclosure, { label: "各组人数、行为均值与后半程收益", children:
          jsxRuntime.jsx(Table, { name: "clusters", caption: "前半程行为均值与后半程收益（便士/屏）", id: "cluster-table" })
        }),
        jsxRuntime.jsxs('div', { className: "study-band study-pair study-result", children: [
          jsxRuntime.jsx(Finding, { id: "stability", title: "语句的最佳组数随抽样改变", refs: ["selection", "diagnostics"], children: `全样本中，绘画两组的轮廓系数为0.300。语句四组为0.281，五组为0.278。每次抽80%的人重选组数，绘画286/300次选两组，语句96次选四组、186次选五组

单峰高斯模拟也常出现同样清晰的分界（绘画参考p=0.390，语句p=0.267）。用分组可概括这批人的表现，语句四组的边界仍待新样本验证` }),
          jsxRuntime.jsx(Figure, { query: "selection", title: "300次重抽样中各组数的获选次数", height: 216,
            description: "绘画与语句分别重抽300次，每次在抽中的80%参与者中比较2至5组",
            spec: { type: "bar", x: "组数", y: ["绘画", "语句"], yLabel: "获选次数", showLegend: true, valueDecimals: 0 },
          }),
        ] }),
      ] }),
      jsxRuntime.jsxs('section', { id: "eye-tracking", className: "study-band study-pair study-result", tabIndex: -1, 'aria-label': "眼动与生理", children: [
        jsxRuntime.jsx(Finding, { id: "signals", title: "第4次选择更常看向最终选中的项目", refs: ["gaze", "coverage", "alltests"], children: `绘画从11.8%升至40.1%（40人，增加28.3个百分点），语句从11.7%升至30.1%（29人，增加18.3个百分点），两项校正p均低于0.001。分母为能定位到某个项目的采样点。第4次时选项也更少，仅凭视线落点无法判断注意力是否增强

绘画决策阶段的瞳孔读数较探索阶段高2.24个基线调整单位（40人，95%区间1.75至2.72，校正p<0.001）。语句瞳孔与绘画心率差异均未通过校正，语句心率因记录错误排除` }),
        jsxRuntime.jsx(Figure, { query: "gaze", title: "第1次与第4次选择的注视占比", height: 216,
          spec: { type: "bar", x: "任务", y: ["第1次", "第4次"], yLabel: "看向最终所选项目（%）", showLegend: true, valueDecimals: 1 },
        }),
      ] }),
      jsxRuntime.jsxs('section', { id: "methods", className: "study-band", tabIndex: -1, 'aria-label': "统计与来源", children: [
        jsxRuntime.jsx(ReportDisclosure, { label: "统计口径、复算说明与23项检验", children: [
          jsxRuntime.jsx(Finding, { id: "review", title: "与上次分析的核对", refs: ["clusters", "diagnostics", "alltests", "selection"], children: `复算重现了样本量、分组人数、后半程收益，以及换作者、眼动和瞳孔的主要结果。固定组数时，重抽样的标签一致性中位数在绘画为1.00、语句为0.83。是否能提高对新参与者的预测，仍需独立样本比较` }),
          jsxRuntime.jsx(dataApp.RichNarrative, { id: "methods-text", className: "report-finding-prose", value: `### 检验与复算

整段比较先在每人内部求前、后半程均值。配对差用单样本t检验，独立实验组的加权变化差用Welch近似，后测组间用Welch总体检验，排名关系用Spearman秩相关。23项探索性检验统一做Holm校正，以校正p<0.05为阈值。95%区间均为单项区间

聚类的单峰高斯参照另作299次模拟，每次保留协方差结构并重选组数。固定组数的重抽样把余下20%的人分组，与全样本标签比较（调整兰德指数，1代表完全一致）。改用Ward层次聚类后，与同组数K均值标签的一致性在绘画为0.36，语句为0.66。所有抽样共用同一批原始参与者

保持组的收益在绘画从35.44升至44.94便士/屏，在语句从31.93升至37.95（校正p分别低于0.001和0.019）。实验组别依实际风险、新颖性和切换轨迹划分，语句有1人编号前缀与轨迹不一致

相对时间间隔覆盖同一轮的两个决策屏幕。生理数据先在同人同轮合并可用的决策屏幕值，与探索阶段配对，再按人平均。眼动保留同屏第1和第4次均可定位、有唯一最终选项的记录。绘画41份中有1份阶段标签冲突被排除，余下1,156个可配对屏幕，语句29份共649屏

在仓库根目录运行\`uv run --locked src/explore.py\`。在\`output/\`中，\`contrasts.csv\`记录完整精度，\`clusters.csv\`记录各组均值，\`cluster_checks.csv\`记录各组数与模拟结果，\`dimension_links.csv\`记录指标间关系。字段含义见\`experiment/\`中的工作坊4.2与6讲义` }),
          jsxRuntime.jsx(Table, { name: "alltests", caption: "全部检验 · 含原始p值与Holm校正值", id: "test-table" }),
        ] }),
      ] }),
    ],
  });
}

exports.DashboardContent = DashboardContent;
exports.ReportContent = ReportContent;

})(__dataAuthoredModule,__dataAuthoredModule.exports,__dataAuthoredRequire);
return {DashboardContent:__dataAuthoredModule.exports.DashboardContent,ReportContent:__dataAuthoredModule.exports.ReportContent};
})(runtime, snapshot)});
} catch(error) { status.fail(error,stage); }
})();
