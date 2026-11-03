import { useEffect, useMemo, useRef, useState } from "react"
import {
  calculateSummaryChange,
  formatPrice,
  productById,
  productDataValidationIssues,
  products,
  retryMockChart,
  selectRecentIssues,
  type ChartRuntimeStatus,
  type DataQuality,
  type Period,
  type PriceInsight as PriceInsightData,
  type PricePoint,
  type Product,
  type ProductId,
  type RelatedIssue,
} from "./products"

type Route = { page: "home" } | { page: "detail"; productId: ProductId }
type DetailTab = "insight" | "issues"

const EXIT_ANIMATION_MS = 180
const exitAnimationDuration = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : EXIT_ANIMATION_MS

const readRoute = (): Route => {
  const match = window.location.hash.match(/^#\/products\/([^/]+)$/)
  const product = productById(match?.[1] ?? null)
  return product ? { page: "detail", productId: product.id } : { page: "home" }
}

function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute)
  useEffect(() => {
    const sync = () => setRoute(readRoute())
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])
  const navigate = (next: Route) => {
    window.location.hash =
      next.page === "home" ? "#/" : `#/products/${next.productId}`
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return { route, navigate }
}

function Icon({
  src,
  alt = "",
  size = "medium",
}: {
  src: string
  alt?: string
  size?: "small" | "medium"
}) {
  return <img className={`icon icon--${size}`} src={src} alt={alt} />
}

type ActionProps = {
  children: React.ReactNode
  className?: string
  pressed?: boolean
  expanded?: boolean
  controls?: string
  label?: string
  disabled?: boolean
  autoFocus?: boolean
  id?: string
  role?: React.AriaRole
  selected?: boolean
  tabIndex?: number
  onClick?: () => void
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
  type?: "button" | "submit"
}

function Action({
  children,
  className = "",
  pressed,
  expanded,
  controls,
  label,
  disabled,
  autoFocus,
  id,
  role,
  selected,
  tabIndex,
  onClick,
  onKeyDown,
  type = "button",
}: ActionProps) {
  return (
    <button
      type={type}
      id={id}
      className={className}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={label}
      disabled={disabled}
      autoFocus={autoFocus}
      role={role}
      aria-selected={selected}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  )
}

function BrandHeader({
  activeDetailTab,
  isHome,
  menuOpen,
  onChat,
  onHome,
  onIssues,
  onMenu,
}: {
  activeDetailTab: DetailTab
  isHome: boolean
  menuOpen: boolean
  onChat: () => void
  onHome: () => void
  onIssues: () => void
  onMenu: () => void
}) {
  return (
    <header className="brand-header">
      <div className="brand-header__inner">
        <div className="header-leading">
          <Action
            className="brand"
            label="오늘의 수산 홈으로 이동"
            onClick={onHome}
          >
            <Icon src="/assets/62f11.svg" />
            <span>오늘의 수산</span>
          </Action>
        </div>
        <nav className="desktop-navigation" aria-label="데스크톱 주요 메뉴">
          <Action
            className={`desktop-nav-item ${
              isHome || activeDetailTab === "insight"
                ? "desktop-nav-item--active"
                : ""
            }`}
            onClick={onHome}
          >
            홈 / 가격 확인
          </Action>
          <Action
            className={`desktop-nav-item ${
              !isHome && activeDetailTab === "issues"
                ? "desktop-nav-item--active"
                : ""
            }`}
            onClick={onIssues}
          >
            최근 이슈
          </Action>
          <Action className="desktop-nav-item" onClick={onChat}>
            익명 채팅
          </Action>
        </nav>
        <Action
          className="icon-action mobile-menu-action"
          label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          expanded={menuOpen}
          controls="primary-navigation"
          onClick={onMenu}
        >
          <Icon src={menuOpen ? "/assets/e16fa.svg" : "/assets/f9b1f.svg"} />
        </Action>
      </div>
    </header>
  )
}

function Navigation({
  closing,
  onHome,
  onProduct,
}: {
  closing: boolean
  onHome: () => void
  onProduct: (id: ProductId) => void
}) {
  return (
    <nav
      className={`navigation ${closing ? "navigation--closing" : ""}`}
      id="primary-navigation"
      aria-label="주요 메뉴"
    >
      <Action className="nav-item nav-item--active" onClick={onHome}>
        홈 · 가격 보기
      </Action>
      {products.map((product) => (
        <Action
          className="nav-item"
          key={product.id}
          onClick={() => onProduct(product.id)}
        >
          {product.name} 상세
        </Action>
      ))}
    </nav>
  )
}

function PriceChange({
  amount,
  rate,
}: {
  amount: number | null
  rate: number | null
}) {
  if (amount === null || rate === null) {
    return <span className="change change--neutral">비교값 없음</span>
  }
  const amountSign = amount > 0 ? "+" : amount < 0 ? "−" : ""
  const rateSign = rate > 0 ? "+" : rate < 0 ? "−" : ""
  return (
    <span
      className={`change ${
        amount > 0
          ? "change--up"
          : amount < 0
            ? "change--down"
            : "change--neutral"
      }`}
    >
      {amountSign}
      {Math.abs(amount).toLocaleString("ko-KR")}원 · {rateSign}
      {Math.abs(rate).toFixed(1)}%
    </span>
  )
}

function ProductCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: () => void
}) {
  const change = calculateSummaryChange(product)
  return (
    <article className="product-card">
      <Action className="product-card__action" onClick={onSelect}>
        <span className="product-card__topline">
          <strong>{product.name}</strong>
          <span>상세 보기 →</span>
        </span>
        {product.summary.price === null ? (
          <span className="product-card__empty">
            <strong>가격 자료 없음</strong>
            <span>이전 값으로 대체하지 않음</span>
          </span>
        ) : (
          <>
            <span className="product-card__price">
              {product.summary.price.toLocaleString("ko-KR")}
              <small>{product.summary.unit}</small>
            </span>
            <PriceChange amount={change.amount} rate={change.rate} />
          </>
        )}
        <span className="product-card__date">
          {product.summary.period} · 예시 데이터
        </span>
      </Action>
    </article>
  )
}

function SearchResultsSkeleton() {
  return (
    <div
      className="search-results-skeleton"
      role="status"
      aria-label="수산물 검색 결과를 불러오는 중"
    >
      <span className="sr-only">검색 중입니다.</span>
      {[0, 1, 2].map((item) => (
        <div className="search-skeleton-card" key={item} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}

function HomePage({ onProduct }: { onProduct: (id: ProductId) => void }) {
  const [query, setQuery] = useState("")
  const [settledQuery, setSettledQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [feedback, setFeedback] = useState("")
  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setSettledQuery("")
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const timer = window.setTimeout(() => {
      setSettledQuery(normalizedQuery)
      setIsSearching(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])
  const filteredProducts = settledQuery
    ? products.filter((product) => product.name.includes(settledQuery))
    : products
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const match = products.find((product) =>
      product.name.includes(query.trim()),
    )
    if (match) {
      onProduct(match.id)
      return
    }
    setFeedback("지원하는 품목은 고등어, 갈치, 물오징어입니다.")
  }
  return (
    <main className="page home-page">
      <section className="home-intro" aria-labelledby="home-title">
        <p className="eyebrow">오늘의 가격, 바다의 이야기</p>
        <h1 id="home-title">수산물 가격을 이해하기 쉽게</h1>
        <p>
          여러 시장에서 관측된 가격을 통합한 대표 지표와 가격 변화의 배경을
          확인하세요.
        </p>
      </section>

      <div className="search-banner">
        <form className="search" role="search" onSubmit={submit}>
          <Icon src="/assets/88b2f.svg" size="small" />
          <label className="sr-only" htmlFor="species-search">
            수산물 검색
          </label>
          <input
            id="species-search"
            value={query}
            placeholder="고등어, 갈치, 물오징어 검색"
            onChange={(event) => {
              setQuery(event.target.value)
              setFeedback("")
            }}
          />
          <Action type="submit" className="search-action">
            찾기
          </Action>
        </form>
        {feedback && (
          <p className="search-feedback" role="status">
            {feedback}
          </p>
        )}
      </div>

      <section className="product-list" aria-labelledby="product-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">최신 완료 반월</p>
            <h2 id="product-list-title">지금 확인하는 수산물</h2>
          </div>
          <span className="count">
            {isSearching ? "검색 중" : `${filteredProducts.length}개 품목`}
          </span>
        </div>
        <div className="product-list__items">
          {isSearching ? (
            <SearchResultsSkeleton />
          ) : filteredProducts.length ? (
            filteredProducts.map((product) => (
              <ProductCard
                product={product}
                key={product.id}
                onSelect={() => onProduct(product.id)}
              />
            ))
          ) : (
            <div
              className="feedback-message feedback-message--empty search-empty"
              role="status"
            >
              <strong>일치하는 지원 품목이 없습니다.</strong>
              <span>고등어, 갈치, 물오징어를 검색해 보세요.</span>
            </div>
          )}
        </div>
        <p className="policy-note">
          대표 가격은 KAMIS 중도매인 판매가격 중 유효한 시장별 가격을 단순평균한
          예시 지표입니다.
        </p>
      </section>
    </main>
  )
}

function DetailHeader({ product }: { product: Product }) {
  return (
    <section className="detail-header">
      <p className="eyebrow">수산물 상세 · 예시 데이터</p>
      <h1>{product.name} 가격 추이</h1>
      <p>대표 가격에서 기간별 변화, 분석 근거와 데이터 품질까지 확인합니다.</p>
    </section>
  )
}

function PriceSummary({ product }: { product: Product }) {
  const { summary } = product
  const change = calculateSummaryChange(product)
  return (
    <section className="price-summary" aria-labelledby="price-title">
      <div className="summary-topline">
        <div>
          <p className="eyebrow">복수 시장 통합 대표 가격지표</p>
          <h2 id="price-title">{product.name}</h2>
        </div>
        <span
          className={`status-badge ${
            summary.status === "missing" ? "status-badge--neutral" : ""
          }`}
        >
          {summary.status === "missing" ? "자료 없음" : "집계 완료"}
        </span>
      </div>
      {summary.price === null ? (
        <div className="feedback-message feedback-message--empty" role="status">
          <strong>최신 완료 반월의 가격 자료가 없습니다.</strong>
          <span>이전 값이나 0원으로 대체하지 않습니다.</span>
        </div>
      ) : (
        <>
          <p className="price">
            <strong>{summary.price.toLocaleString("ko-KR")}</strong>
            <span>{summary.unit}</span>
          </p>
          <PriceChange amount={change.amount} rate={change.rate} />
          <p className="price-period">{summary.period} · 완료 반월</p>
        </>
      )}
      <p className="summary-note">
        국산 생물 · 유효 시장별 가격 단순평균 · 실제 구매가격이나 전국
        소비자가격이 아닙니다.
      </p>
    </section>
  )
}

function PeriodSelector({
  period,
  onChange,
}: {
  period: Period
  onChange: (period: Period) => void
}) {
  return (
    <div className="period-control" role="group" aria-label="차트 기간 단위">
      {(["halfMonth", "monthly"] as Period[]).map((value) => (
        <Action
          key={value}
          className={`period-button ${
            period === value ? "period-button--active" : ""
          }`}
          pressed={period === value}
          onClick={() => onChange(value)}
        >
          {value === "halfMonth" ? "반월(15일)" : "월별"}
        </Action>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div
      className="chart-skeleton"
      role="status"
      aria-label="가격 차트를 불러오는 중"
    >
      <span />
      <span />
      <span />
    </div>
  )
}

function InteractivePlot({
  points,
  selectedId,
  onSelect,
}: {
  points: PricePoint[]
  selectedId: string | null
  onSelect: (point: PricePoint) => void
}) {
  const values = points.flatMap((point) =>
    point.value === null ? [] : [point.value],
  )
  const min = Math.floor(Math.min(...values) / 500) * 500
  const maxBase = Math.ceil(Math.max(...values) / 500) * 500
  const max = maxBase === min ? min + 500 : maxBase
  const position = (point: PricePoint, index: number) => ({
    x: 8 + (index / Math.max(points.length - 1, 1)) * 84,
    y:
      point.value === null ? 50 : 84 - ((point.value - min) / (max - min)) * 68,
  })
  const segments: string[] = []
  let current: string[] = []
  points.forEach((point, index) => {
    if (point.value === null) {
      if (current.length > 1) segments.push(current.join(" "))
      current = []
      return
    }
    const { x, y } = position(point, index)
    current.push(`${x},${y}`)
  })
  if (current.length > 1) segments.push(current.join(" "))
  const selected = points.find((point) => point.id === selectedId)
  const selectedIndex = selected ? points.indexOf(selected) : -1
  const selectedPosition =
    selected && selected.value !== null
      ? position(selected, selectedIndex)
      : null

  return (
    <>
      <p className="sr-only" id="chart-instructions">
        각 가격 시점 버튼을 선택하면 해당 기간의 가격과 분석을 확인할 수
        있습니다. 자료가 없는 기간은 선택할 수 없습니다.
      </p>
      <ul className="sr-only" id="chart-data-summary">
        {points.map((point) => (
          <li key={point.id}>
            {point.fullLabel}:{" "}
            {point.value === null ? "자료 없음" : formatPrice(point.value)}
          </li>
        ))}
      </ul>
      <div
        className="plot"
        role="group"
        aria-label="가격 데이터 포인트 선택"
        aria-describedby="chart-instructions chart-data-summary"
      >
        <div className="plot__y-axis" aria-hidden="true">
          <span>{max.toLocaleString("ko-KR")}</span>
          <span>{min.toLocaleString("ko-KR")}</span>
        </div>
        <div className="plot__canvas">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="16" x2="100" y2="16" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="84" x2="100" y2="84" />
            {segments.map((segment) => (
              <polyline key={segment} points={segment} />
            ))}
          </svg>
          {points.map((point, index) => {
            const { x, y } = position(point, index)
            return (
              <Action
                key={point.id}
                className={`plot-point ${
                  point.value === null ? "plot-point--missing" : ""
                } ${selectedId === point.id ? "plot-point--selected" : ""}`}
                pressed={selectedId === point.id}
                disabled={point.value === null}
                label={
                  point.value === null
                    ? `${point.fullLabel}, 자료 없음`
                    : `${point.fullLabel}, ${formatPrice(point.value)} 선택`
                }
                onClick={() => onSelect(point)}
              >
                <span
                  className="plot-point__position"
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              </Action>
            )
          })}
          {selected && selectedPosition && (
            <div
              className={`chart-tooltip ${
                selectedPosition.y < 38 ? "chart-tooltip--below" : ""
              }`}
              style={{
                left: `${Math.min(Math.max(selectedPosition.x, 18), 82)}%`,
                top: `${
                  selectedPosition.y < 38
                    ? selectedPosition.y + 10
                    : selectedPosition.y - 8
                }%`,
              }}
              role="status"
            >
              <span>{selected.fullLabel}</span>
              <strong>{formatPrice(selected.value)}</strong>
            </div>
          )}
        </div>
      </div>
      <div className="plot__x-axis" aria-hidden="true">
        {points.map((point, index) => (
          <span className={index % 2 ? "label-optional" : ""} key={point.id}>
            {point.label}
          </span>
        ))}
      </div>
    </>
  )
}

function SelectionInfo({ point }: { point: PricePoint | null }) {
  if (!point) return null
  return (
    <div className="chart-selection" aria-live="polite">
      <div>
        <span>선택 시점</span>
        <strong>{point.fullLabel}</strong>
      </div>
      <div>
        <span>선택 시점 가격</span>
        <strong>{formatPrice(point.value)}</strong>
      </div>
      <span className="selection-status">
        {point.value === null ? "자료 없음" : "유효 관측 데이터"}
      </span>
    </div>
  )
}

function PriceTrendChart({
  product,
  period,
  selectedId,
  onPeriod,
  onPoint,
}: {
  product: Product
  period: Period
  selectedId: string | null
  onPeriod: (period: Period) => void
  onPoint: (point: PricePoint) => void
}) {
  const chart = product.history[period]
  const [runtimeStatus, setRuntimeStatus] = useState<ChartRuntimeStatus | null>(
    null,
  )
  const effectiveStatus = runtimeStatus ?? chart.status
  const selected = chart.points.find((point) => point.id === selectedId) ?? null
  const retry = async () => {
    setRuntimeStatus("loading")
    setRuntimeStatus(await retryMockChart(product, period))
  }
  useEffect(() => setRuntimeStatus(null), [product.id, period])

  return (
    <section className="chart-section" aria-labelledby="chart-title">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">가격 추이</p>
          <h2 id="chart-title">{product.name} 평균가격</h2>
        </div>
        <PeriodSelector period={period} onChange={onPeriod} />
      </div>
      <div className="chart-meta">
        <span>
          {period === "halfMonth"
            ? `15일(반월) · ${chart.description}`
            : chart.description}
        </span>
        <span>단위 원/kg</span>
      </div>

      {effectiveStatus === "loading" && <ChartSkeleton />}
      {effectiveStatus === "error" && (
        <div className="feedback-message feedback-message--error" role="alert">
          <strong>가격 추이를 불러오지 못했습니다.</strong>
          <span>대표 가격과 다른 정보는 계속 확인할 수 있습니다.</span>
          <Action className="secondary-action" onClick={retry}>
            다시 시도
          </Action>
        </div>
      )}
      {effectiveStatus === "empty" && (
        <div className="feedback-message feedback-message--empty" role="status">
          <strong>표시할 가격 추이 자료가 없습니다.</strong>
          <span>확인되지 않은 가격을 임의로 표시하지 않습니다.</span>
        </div>
      )}
      {(effectiveStatus === "ready" || effectiveStatus === "partial") && (
        <>
          {effectiveStatus === "partial" && (
            <p className="partial-notice">
              일부 기간에 자료가 없어 선을 연결하지 않습니다.
            </p>
          )}
          <div className="chart-frame">
            <InteractivePlot
              points={chart.points}
              selectedId={selectedId}
              onSelect={onPoint}
            />
          </div>
          <SelectionInfo point={selected} />
        </>
      )}
    </section>
  )
}

function PriceInsight({
  product,
  point,
}: {
  product: Product
  point: PricePoint | null
}) {
  const insight = product.insights.find((item) => item.id === point?.insightId)
  return (
    <section className="insight" aria-labelledby="insight-title">
      <div className="insight-heading">
        <Icon src="/assets/83afc.svg" size="small" />
        <div>
          <p className="eyebrow">
            {point ? `${point.fullLabel} 분석` : "선택 기간 분석"}
          </p>
          <h2 id="insight-title">Price Insight</h2>
        </div>
      </div>
      {!point ? (
        <div className="insight-pending" role="status">
          <span className="status-badge status-badge--neutral">
            기간 미선택
          </span>
          <h3>차트에서 분석할 기간을 선택해 주세요.</h3>
          <p>
            15일 차트의 점은 해당 반월, 월별 차트의 점은 해당 월 전체를
            선택합니다.
          </p>
        </div>
      ) : !insight ? (
        <div className="insight-pending" role="status">
          <span className="status-badge status-badge--neutral">파악 중</span>
          <h3>이 기간의 분석 자료를 확인하고 있습니다.</h3>
          <p>
            다른 기간의 해석을 재사용하지 않습니다. 근거가 확인되기 전까지
            원인을 추정하지 않습니다.
          </p>
        </div>
      ) : (
        <InsightContent insight={insight} point={point} />
      )}
    </section>
  )
}

function InsightContent({
  insight,
  point,
}: {
  insight: PriceInsightData
  point: PricePoint
}) {
  return (
    <>
      <div className="insight-summary">
        <div className="insight-summary__meta">
          <span>{insight.period}</span>
          <span>분석 기준 {insight.analyzedAt}</span>
        </div>
        <span className="insight-price-label">선택 기간 평균가격</span>
        <strong className="insight-price">{formatPrice(point.value)}</strong>
        <p>{insight.summary}</p>
      </div>
      <div className="fact-block">
        <span className="section-label">확인된 사실</span>
        <p>{insight.fact}</p>
      </div>
      <div className="interpretation-block">
        <div className="interpretation-title">
          <span className="section-label section-label--ocean">
            가능한 해석
          </span>
          <span className="interpretation-badge">
            {insight.status === "pending" ? "파악 중" : "원인 확정 아님"}
          </span>
        </div>
        {insight.factors.length ? (
          <ol className="factor-list">
            {insight.factors.slice(0, 3).map((factor, index) => (
              <li key={factor.title}>
                <h3>
                  {String(index + 1).padStart(2, "0")} · {factor.title}
                </h3>
                <span>{factor.category} · 가능한 해석</span>
                <p>{factor.description}</p>
                <small>근거 · {factor.source}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p>근거 자료가 충분하지 않아 변동 요인을 제시하지 않습니다.</p>
        )}
        <p className="limitation">분석의 한계 · {insight.limitation}</p>
        {insight.factors.length > 0 && (
          <div className="insight-sources">
            <span className="section-label">관련 근거 자료</span>
            {insight.factors.slice(0, 3).map((factor) => (
              <p key={factor.source}>{factor.source}</p>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function DetailTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab
  onChange: (tab: DetailTab) => void
}) {
  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "insight", label: "Price Insight" },
    { id: "issues", label: "최근 이슈" },
  ]
  const moveTab = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const keyDirection =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "Home"
            ? -currentIndex
            : event.key === "End"
              ? tabs.length - 1 - currentIndex
              : 0
    if (!keyDirection) return
    event.preventDefault()
    const nextIndex =
      (currentIndex + keyDirection + tabs.length) % tabs.length
    const nextTab = tabs[nextIndex]
    onChange(nextTab.id)
    requestAnimationFrame(() => {
      document.getElementById(`detail-tab-${nextTab.id}`)?.focus()
    })
  }
  return (
    <div className="detail-tabs" role="tablist" aria-label="상세 정보">
      {tabs.map((tab, index) => (
        <Action
          key={tab.id}
          id={`detail-tab-${tab.id}`}
          className={`detail-tab ${
            activeTab === tab.id ? "detail-tab--active" : ""
          }`}
          role="tab"
          selected={activeTab === tab.id}
          controls={`${tab.id}-panel`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => moveTab(event, index)}
        >
          {tab.label}
        </Action>
      ))}
    </div>
  )
}

function DataQualityAccordion({
  quality,
  expanded,
  onToggle,
}: {
  quality: DataQuality
  expanded: boolean
  onToggle: () => void
}) {
  const statusText =
    quality.status === "complete"
      ? "관측 완료"
      : quality.status === "partial"
        ? "일부 결측"
        : "관측 자료 없음"
  return (
    <section
      className="data-quality"
      id="quality"
      aria-labelledby="quality-title"
    >
      <Action
        className="accordion-trigger"
        expanded={expanded}
        controls="quality-content"
        onClick={onToggle}
      >
        <span>
          <span className="eyebrow">데이터 품질</span>
          <strong id="quality-title">
            {statusText} · 관측일 {quality.observedDays}일 · 시장{" "}
            {quality.markets}개
          </strong>
        </span>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </Action>
      {expanded && (
        <div className="accordion-content" id="quality-content">
          <dl>
            <div>
              <dt>결측 여부</dt>
              <dd>
                {quality.missingPoints
                  ? `${quality.missingPoints}개 구간`
                  : "결측 없음"}
              </dd>
            </div>
            <div>
              <dt>가격 집계</dt>
              <dd>{quality.aggregation}</dd>
            </div>
            <div>
              <dt>원천 데이터</dt>
              <dd>{quality.source}</dd>
            </div>
            <div>
              <dt>대상 범위</dt>
              <dd>{quality.scope}</dd>
            </div>
          </dl>
          <p>가격·기사·Insight는 인터랙션 검증을 위한 예시 데이터입니다.</p>
        </div>
      )}
    </section>
  )
}

function RelatedIssueList({
  productName,
  issues,
  expanded,
  onToggle,
}: {
  productName: string
  issues: RelatedIssue[]
  expanded: boolean
  onToggle: () => void
}) {
  const eligibleIssues = useMemo(() => selectRecentIssues(issues), [issues])
  const visible = expanded ? eligibleIssues : eligibleIssues.slice(0, 5)
  return (
    <section className="issues" aria-labelledby="issues-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">최근 30일 · 최신순</p>
          <h2 id="issues-title">{productName} 최근 이슈</h2>
        </div>
        <Icon src="/assets/8a97a.svg" size="small" />
      </div>
      <p className="issue-mock-note">
        가상 Mock 데이터 · 원문 보기는 예시 외부 페이지로 연결됩니다.
      </p>
      {!eligibleIssues.length ? (
        <div
          className="feedback-message feedback-message--empty"
          role="status"
        >
          <strong>관련 이슈가 없습니다.</strong>
          <span>확인되지 않은 기사나 링크를 생성하지 않습니다.</span>
        </div>
      ) : (
        <>
          <div className="issue-list">
            {visible.map((issue) => {
              const issueUrl =
                issue.url ??
                `https://example.com/todays-sea/issues/${issue.id}`
              return (
                <article className="issue-item" key={issue.id}>
                  <div className="issue-copy">
                    <strong>{issue.title}</strong>
                    <span>
                      {issue.source} · {issue.date}
                    </span>
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${issue.title} 가상 원문 보기, 새 창`}
                    >
                      원문 보기 ↗
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
          {eligibleIssues.length > 5 && (
            <Action
              className="secondary-action issue-more"
              expanded={expanded}
              onClick={onToggle}
            >
              {expanded
                ? "간단히 보기"
                : `더보기 · ${eligibleIssues.length - 5}건 추가`}
            </Action>
          )}
        </>
      )}
    </section>
  )
}

function ProductDetailPage({
  activeTab,
  onTabChange,
  product,
}: {
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  product: Product
}) {
  const [period, setPeriod] = useState<Period>("halfMonth")
  const [selectedDataPoint, setSelectedDataPoint] = useState<string | null>(
    null,
  )
  const [dataQualityExpanded, setDataQualityExpanded] = useState(false)
  const [issueListExpanded, setIssueListExpanded] = useState(false)
  const selectedPoint =
    product.history[period].points.find(
      (point) => point.id === selectedDataPoint,
    ) ?? null
  const changePeriod = (next: Period) => {
    setPeriod(next)
    setSelectedDataPoint(null)
    setDataQualityExpanded(false)
  }

  return (
    <main className="page detail-page">
      <DetailHeader product={product} />
      <PriceSummary product={product} />
      <PriceTrendChart
        product={product}
        period={period}
        selectedId={selectedDataPoint}
        onPeriod={changePeriod}
        onPoint={(point) => setSelectedDataPoint(point.id)}
      />
      <DetailTabs activeTab={activeTab} onChange={onTabChange} />
      <div
        id="insight-panel"
        role="tabpanel"
        aria-labelledby="detail-tab-insight"
        hidden={activeTab !== "insight"}
      >
        <PriceInsight product={product} point={selectedPoint} />
      </div>
      <div
        id="issues-panel"
        role="tabpanel"
        aria-labelledby="detail-tab-issues"
        hidden={activeTab !== "issues"}
      >
        <RelatedIssueList
          productName={product.name}
          issues={product.issues}
          expanded={issueListExpanded}
          onToggle={() => setIssueListExpanded((value) => !value)}
        />
      </div>
      <DataQualityAccordion
        quality={product.history[period].quality}
        expanded={dataQualityExpanded}
        onToggle={() => setDataQualityExpanded((value) => !value)}
      />
    </main>
  )
}

function ChatPanel({
  closing,
  productName,
  incomingMessages,
  messages,
  onSend,
  onClose,
}: {
  closing: boolean
  productName: string
  incomingMessages: string[]
  messages: string[]
  onSend: (message: string) => void
  onClose: () => void
}) {
  const [message, setMessage] = useState("")
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const next = message.trim()
    if (!next) return
    onSend(next)
    setMessage("")
  }
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  return (
    <aside
      className={`chat-panel ${closing ? "chat-panel--closing" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-panel-title"
      aria-describedby="chat-connection-status"
    >
      <div className="chat-header">
        <div>
          <strong id="chat-panel-title">{productName} 채팅</strong>
          <span>Mock 채팅 · 서버 미연결</span>
        </div>
        <Action
          className="icon-action"
          label="채팅 닫기"
          autoFocus
          onClick={onClose}
        >
          <Icon src="/assets/1fd2d.svg" />
        </Action>
      </div>
      <div
        className="connection-banner"
        id="chat-connection-status"
        role="status"
      >
        서버에 연결되지 않은 로컬 시뮬레이션입니다.
      </div>
      <div
        className="messages"
        role="log"
        aria-label={`${productName} 채팅 메시지`}
        aria-live="polite"
        aria-relevant="additions text"
      >
        <div className="message message--other">
          <span>초록 물결 · 16:11</span>
          <p>{productName} 가격 흐름을 함께 확인해 보세요.</p>
        </div>
        {incomingMessages.map((item, index) => (
          <div className="message message--other" key={`${item}-${index}`}>
            <span>잔잔한 파도 · 방금</span>
            <p>{item}</p>
          </div>
        ))}
        {messages.map((item, index) => (
          <div className="message message--mine" key={`${item}-${index}`}>
            <span>나 · 방금</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
      <form className="composer" onSubmit={submit}>
        <label htmlFor="chat-message">메시지</label>
        <div>
          <input
            id="chat-message"
            value={message}
            maxLength={300}
            placeholder="메시지를 입력하세요"
            aria-describedby="chat-character-count"
            autoComplete="off"
            onChange={(event) => setMessage(event.target.value)}
          />
          <Action
            type="submit"
            className="send-action"
            label="메시지 보내기"
            disabled={!message.trim()}
          >
            <Icon src="/assets/43ec3.svg" size="small" />
          </Action>
        </div>
        <span className="composer-meta" id="chat-character-count">
          {message.length} / 300자
        </span>
      </form>
    </aside>
  )
}

export default function App() {
  const { route, navigate } = useRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const [detailTab, setDetailTab] = useState<DetailTab>("insight")
  const [chatOpen, setChatOpen] = useState(false)
  const [chatClosing, setChatClosing] = useState(false)
  const menuCloseTimer = useRef<number | null>(null)
  const chatCloseTimer = useRef<number | null>(null)
  const simulatedIncoming = useRef(new Set<ProductId>())
  const [chatMessages, setChatMessages] = useState<Record<ProductId, string[]>>(
    {
      hairtail: [],
      mackerel: [],
      squid: [],
    },
  )
  const [incomingMessages, setIncomingMessages] = useState<
    Record<ProductId, string[]>
  >({
    hairtail: [],
    mackerel: [],
    squid: [],
  })
  const [unreadProducts, setUnreadProducts] = useState<
    Partial<Record<ProductId, boolean>>
  >({})
  const selectedProduct = useMemo(
    () =>
      route.page === "detail" ? productById(route.productId) : products[0],
    [route],
  )
  const closeMenu = () => {
    if (!menuOpen || menuClosing) return
    setMenuClosing(true)
    menuCloseTimer.current = window.setTimeout(() => {
      setMenuOpen(false)
      setMenuClosing(false)
      menuCloseTimer.current = null
    }, exitAnimationDuration())
  }
  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu()
      return
    }
    setMenuClosing(false)
    setMenuOpen(true)
  }
  const goHome = () => {
    navigate({ page: "home" })
    closeMenu()
  }
  const goProduct = (productId: ProductId) => {
    setDetailTab("insight")
    navigate({ page: "detail", productId })
    closeMenu()
  }
  const openIssues = () => {
    setDetailTab("issues")
    if (route.page === "home") {
      navigate({ page: "detail", productId: products[0].id })
    }
    closeMenu()
  }
  const openChat = () => {
    if (selectedProduct) {
      setUnreadProducts((current) => ({
        ...current,
        [selectedProduct.id]: false,
      }))
    }
    setChatClosing(false)
    setChatOpen(true)
  }
  const closeChat = () => {
    if (!chatOpen || chatClosing) return
    setChatClosing(true)
    chatCloseTimer.current = window.setTimeout(() => {
      setChatOpen(false)
      setChatClosing(false)
      chatCloseTimer.current = null
      requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>(".chat-fab")?.focus()
      })
    }, exitAnimationDuration())
  }

  useEffect(() => {
    if (productDataValidationIssues.length) {
      console.error("Mock 데이터 정합성 오류", productDataValidationIssues)
    }
  }, [])

  useEffect(
    () => () => {
      if (menuCloseTimer.current !== null) {
        window.clearTimeout(menuCloseTimer.current)
      }
      if (chatCloseTimer.current !== null) {
        window.clearTimeout(chatCloseTimer.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (
      chatOpen ||
      !selectedProduct ||
      simulatedIncoming.current.has(selectedProduct.id)
    ) {
      return
    }
    const productId = selectedProduct.id
    const timer = window.setTimeout(() => {
      simulatedIncoming.current.add(productId)
      setIncomingMessages((current) => ({
        ...current,
        [productId]: [
          ...current[productId],
          `${selectedProduct.name} 가격 이야기가 새로 도착했어요.`,
        ],
      }))
      setUnreadProducts((current) => ({ ...current, [productId]: true }))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [chatOpen, selectedProduct])

  const hasUnread = selectedProduct
    ? Boolean(unreadProducts[selectedProduct.id])
    : false

  return (
    <div className="app-shell">
      <BrandHeader
        activeDetailTab={detailTab}
        isHome={route.page === "home"}
        menuOpen={menuOpen && !menuClosing}
        onChat={openChat}
        onHome={goHome}
        onIssues={openIssues}
        onMenu={toggleMenu}
      />
      {menuOpen && (
        <Navigation
          closing={menuClosing}
          onHome={goHome}
          onProduct={goProduct}
        />
      )}

      {route.page === "home" ? (
        <HomePage onProduct={goProduct} />
      ) : (
        <ProductDetailPage
          key={`detail-${route.productId}`}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          product={productById(route.productId)!}
        />
      )}

      {!chatOpen && (
        <Action
          className={`chat-fab ${hasUnread ? "chat-fab--unread" : ""}`}
          label={hasUnread ? "새 메시지 있음, 채팅 열기" : "채팅 열기"}
          onClick={openChat}
        >
          <img src="/assets/4ba48.svg" alt="" width="112" height="112" />
          {hasUnread && <span className="chat-fab__unread" aria-hidden="true" />}
        </Action>
      )}
      {chatOpen && (
        <ChatPanel
          key={`chat-${selectedProduct?.id ?? "home"}`}
          closing={chatClosing}
          productName={selectedProduct?.name ?? "수산물"}
          incomingMessages={
            selectedProduct ? incomingMessages[selectedProduct.id] : []
          }
          messages={selectedProduct ? chatMessages[selectedProduct.id] : []}
          onSend={(message) => {
            if (!selectedProduct) return
            setChatMessages((current) => ({
              ...current,
              [selectedProduct.id]: [...current[selectedProduct.id], message],
            }))
          }}
          onClose={closeChat}
        />
      )}
    </div>
  )
}
