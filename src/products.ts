export type ProductId = "hairtail" | "mackerel" | "squid"
export type Period = "halfMonth" | "monthly"
export type ChartStatus = "ready" | "partial" | "empty" | "error"
export type ChartRuntimeStatus = ChartStatus | "loading"

export type PricePoint = {
  id: string
  label: string
  fullLabel: string
  value: number | null
  insightId?: string
}

export type InsightFactor = {
  category: "생산" | "출하" | "수입" | "환경" | "정책" | "뉴스" | "소비 트렌드" | "국제 정세" | "유통"
  title: string
  description: string
  source: string
}

export type PriceInsight = {
  id: string
  status: "complete" | "pending"
  period: string
  analyzedAt: string
  summary: string
  fact: string
  factors: InsightFactor[]
  limitation: string
}

export type DataQuality = {
  status: "complete" | "partial" | "missing"
  observedDays: number
  markets: number
  missingPoints: number
  source: string
  aggregation: string
  scope: string
}

export type RelatedIssue = {
  id: string
  title: string
  source: string
  date: string
  url?: string
}

export type Product = {
  id: ProductId
  name: string
  summary: {
    price: number | null
    unit: "원/kg"
    period: string
    status: "complete" | "missing"
  }
  history: Record<Period, {
    status: ChartStatus
    retryResult?: ChartStatus
    description: string
    points: PricePoint[]
    quality: DataQuality
  }>
  insights: PriceInsight[]
  issues: RelatedIssue[]
}

const commonQuality = {
  source: "KAMIS 중도매인 판매가격",
  aggregation: "유효한 시장별 가격의 단순평균",
  scope: "운영상 분류 규칙을 적용한 국산 생물",
}

export const products: Product[] = [
  {
    id: "hairtail",
    name: "갈치",
    summary: {
      price: 12800,
      unit: "원/kg",
      period: "2026.10.01–10.15",
      status: "complete",
    },
    history: {
      halfMonth: {
        status: "partial",
        description: "반월 예시 6개 · 결측 1개",
        points: [
          {
            id: "h-jul-2",
            label: "7월 하",
            fullLabel: "2026.07.16–07.31",
            value: null,
          },
          {
            id: "h-aug-1",
            label: "8월 상",
            fullLabel: "2026.08.01–08.15",
            value: 12800,
            insightId: "hairtail-aug-1",
          },
          {
            id: "h-aug-2",
            label: "8월 하",
            fullLabel: "2026.08.16–08.31",
            value: 12600,
          },
          {
            id: "h-sep-1",
            label: "9월 상",
            fullLabel: "2026.09.01–09.15",
            value: 13050,
          },
          {
            id: "h-sep-2",
            label: "9월 하",
            fullLabel: "2026.09.16–09.30",
            value: 12700,
          },
          {
            id: "h-oct-1",
            label: "10월 상",
            fullLabel: "2026.10.01–10.15",
            value: 12800,
          },
        ],
        quality: {
          ...commonQuality,
          status: "partial",
          observedDays: 11,
          markets: 5,
          missingPoints: 1,
        },
      },
      monthly: {
        status: "ready",
        description: "완료 월 6개 · 진행 중 월 제외",
        points: [
          { id: "m-apr", label: "4월", fullLabel: "2026년 4월", value: 13400 },
          { id: "m-may", label: "5월", fullLabel: "2026년 5월", value: 12840 },
          { id: "m-jun", label: "6월", fullLabel: "2026년 6월", value: 12650 },
          { id: "m-jul", label: "7월", fullLabel: "2026년 7월", value: 13020 },
          {
            id: "m-aug",
            label: "8월",
            fullLabel: "2026년 8월",
            value: 12730,
            insightId: "hairtail-aug-month",
          },
          { id: "m-sep", label: "9월", fullLabel: "2026년 9월", value: 12890 },
        ],
        quality: {
          ...commonQuality,
          status: "complete",
          observedDays: 22,
          markets: 5,
          missingPoints: 0,
        },
      },
    },
    insights: [
      {
        id: "hairtail-aug-1",
        status: "complete",
        period: "2026.08.01–08.15",
        analyzedAt: "2026.09.01",
        summary: "평균가격은 12,800원/kg이며 직전 반월보다 소폭 상승했습니다.",
        fact: "유효 관측일 11일과 5개 시장의 가격 자료를 반영했습니다.",
        factors: [
          {
            category: "출하",
            title: "산지 출하량 변화 가능성",
            description:
              "가상 출하량 지표와 가격 흐름이 함께 나타났을 가능성을 검토합니다.",
            source: "가상 수산물 수급 동향 · 2026.08.16",
          },
          {
            category: "유통",
            title: "도매시장 거래량 변화 가능성",
            description:
              "시장 거래량 지표와 관측 가격을 함께 비교했으며 추가 검증이 필요합니다.",
            source: "가상 도매시장 거래현황 · 2026.08.17",
          },
        ],
        limitation: "상관관계를 가격 변동의 직접 원인으로 확정할 수 없습니다.",
      },
      {
        id: "hairtail-aug-month",
        status: "complete",
        period: "2026년 8월",
        analyzedAt: "2026.09.10",
        summary: "8월 월평균 가격은 12,730원/kg으로 7월보다 낮았습니다.",
        fact: "완료 월의 유효 관측 자료만 사용했으며 반월 두 값의 단순 평균이 아닙니다.",
        factors: [
          {
            category: "유통",
            title: "월중 거래량 변화 가능성",
            description: "월중 거래량과 가격의 동행 여부를 확인하고 있습니다.",
            source: "가상 도매시장 거래현황 · 2026.09.02",
          },
        ],
        limitation:
          "월 단위 집계는 반월 지표와 산출 범위가 달라 직접 비교에 주의가 필요합니다.",
      },
    ],
    issues: [
      {
        id: "h-i1",
        title: "10월 갈치 산지 출하 동향",
        source: "가상 수산유통 연구소",
        date: "2026.10.18",
      },
      {
        id: "h-i2",
        title: "공영도매시장 수산물 거래량 변화",
        source: "가상 도매시장 정보센터",
        date: "2026.10.15",
      },
      {
        id: "h-i3",
        title: "연근해 어획 여건 분석",
        source: "가상 어업정보 기관",
        date: "2026.10.09",
      },
      {
        id: "h-i4",
        title: "10월 첫째 주 수산물 거래 현황",
        source: "가상 도매시장 정보센터",
        date: "2026.10.03",
      },
      {
        id: "h-i5",
        title: "수산물 소비 동향 분석",
        source: "가상 수산유통 연구소",
        date: "2026.09.30",
      },
      {
        id: "h-i6",
        title: "연안 수온 변화와 조업 여건",
        source: "가상 해황 연구소",
        date: "2026.09.28",
      },
    ],
  },
  {
    id: "mackerel",
    name: "고등어",
    summary: {
      price: 6450,
      unit: "원/kg",
      period: "2026.10.01–10.15",
      status: "complete",
    },
    history: {
      halfMonth: {
        status: "partial",
        description: "완료 반월 5개 · 결측 1개",
        points: [
          {
            id: "mk-aug-1",
            label: "8월 상",
            fullLabel: "2026.08.01–08.15",
            value: 6200,
          },
          {
            id: "mk-aug-2",
            label: "8월 하",
            fullLabel: "2026.08.16–08.31",
            value: 6380,
          },
          {
            id: "mk-sep-1",
            label: "9월 상",
            fullLabel: "2026.09.01–09.15",
            value: null,
          },
          {
            id: "mk-sep-2",
            label: "9월 하",
            fullLabel: "2026.09.16–09.30",
            value: 6320,
          },
          {
            id: "mk-oct-1",
            label: "10월 상",
            fullLabel: "2026.10.01–10.15",
            value: 6450,
            insightId: "mackerel-oct-1",
          },
        ],
        quality: {
          ...commonQuality,
          status: "partial",
          observedDays: 9,
          markets: 4,
          missingPoints: 1,
        },
      },
      monthly: {
        status: "ready",
        description: "완료 월 6개",
        points: [
          { id: "mk-apr", label: "4월", fullLabel: "2026년 4월", value: 6100 },
          { id: "mk-may", label: "5월", fullLabel: "2026년 5월", value: 6180 },
          { id: "mk-jun", label: "6월", fullLabel: "2026년 6월", value: 6300 },
          { id: "mk-jul", label: "7월", fullLabel: "2026년 7월", value: 6250 },
          { id: "mk-aug", label: "8월", fullLabel: "2026년 8월", value: 6290 },
          { id: "mk-sep", label: "9월", fullLabel: "2026년 9월", value: 6360 },
        ],
        quality: {
          ...commonQuality,
          status: "complete",
          observedDays: 20,
          markets: 4,
          missingPoints: 0,
        },
      },
    },
    insights: [
      {
        id: "mackerel-oct-1",
        status: "pending",
        period: "2026.10.01–10.15",
        analyzedAt: "파악 중",
        summary:
          "평균가격은 6,450원/kg으로 직전 유효 반월보다 130원 상승했습니다.",
        fact: "유효 관측일 9일과 4개 시장의 가격 자료를 반영했습니다.",
        factors: [],
        limitation:
          "변동 요인을 뒷받침할 근거 자료가 충분하지 않아 해석을 확정하지 않습니다.",
      },
    ],
    issues: [
      {
        id: "mk-i1",
        title: "가을철 고등어 공급 전망",
        source: "가상 해양수산 연구원",
        date: "2026.10.12",
      },
      {
        id: "mk-i2",
        title: "연근해 어획 여건 분석",
        source: "가상 어업정보 기관",
        date: "2026.10.09",
      },
      {
        id: "mk-i3",
        title: "수산물 소비 동향 분석",
        source: "가상 수산유통 연구소",
        date: "2026.09.30",
      },
      {
        id: "mk-i4",
        title: "고등어 도매가격 주간 동향",
        source: "가상 도매시장 정보센터",
        date: "2026.09.28",
      },
      {
        id: "mk-i5",
        title: "연안 수온과 고등어 어장 변화",
        source: "가상 해황 연구소",
        date: "2026.09.26",
      },
      {
        id: "mk-i6",
        title: "가을철 수산물 반입량 현황",
        source: "가상 수산물 유통센터",
        date: "2026.09.24",
      },
    ],
  },
  {
    id: "squid",
    name: "물오징어",
    summary: {
      price: null,
      unit: "원/kg",
      period: "최신 완료 반월",
      status: "missing",
    },
    history: {
      halfMonth: {
        status: "empty",
        description: "표시 가능한 완료 반월 없음",
        points: [],
        quality: {
          ...commonQuality,
          status: "missing",
          observedDays: 0,
          markets: 0,
          missingPoints: 5,
        },
      },
      monthly: {
        status: "error",
        retryResult: "empty",
        description: "월별 가격 조회 실패",
        points: [],
        quality: {
          ...commonQuality,
          status: "missing",
          observedDays: 0,
          markets: 0,
          missingPoints: 6,
        },
      },
    },
    insights: [],
    issues: [
      {
        id: "sq-i1",
        title: "동해안 물오징어 조업 동향",
        source: "가상 어업정보 기관",
        date: "2026.10.19",
      },
      {
        id: "sq-i2",
        title: "공영도매시장 오징어류 거래 현황",
        source: "가상 도매시장 정보센터",
        date: "2026.10.16",
      },
      {
        id: "sq-i3",
        title: "연안 수온과 오징어 어장 분석",
        source: "가상 해황 연구소",
        date: "2026.10.11",
      },
      {
        id: "sq-i4",
        title: "수산물 유통시장 주간 동향",
        source: "가상 수산유통 연구소",
        date: "2026.10.07",
      },
      {
        id: "sq-i5",
        title: "10월 오징어류 반입량 현황",
        source: "가상 도매시장 정보센터",
        date: "2026.10.03",
      },
      {
        id: "sq-i6",
        title: "가을철 수산물 소비 동향",
        source: "가상 수산유통 연구소",
        date: "2026.09.27",
      },
    ],
  },
]

export const productById = (id: string | null) =>
  products.find((product) => product.id === id)

export const formatPrice = (value: number | null) =>
  value === null ? "자료 없음" : `${value.toLocaleString("ko-KR")}원/kg`

export const calculateSummaryChange = (product: Product) => {
  const points = product.history.halfMonth.points
  const current = points.at(-1)?.value ?? null
  const comparison = points.at(-2)?.value ?? null
  if (
    product.summary.price === null ||
    current === null ||
    comparison === null ||
    comparison === 0
  ) {
    return { amount: null, rate: null }
  }
  const amount = current - comparison
  return {
    amount,
    rate: Math.round((amount / comparison) * 1000) / 10,
  }
}

export const ISSUE_REFERENCE_DATE = "2026-10-22"

const subtractCalendarDays = (date: string, count: number) => {
  const [year, month, day] = date.split("-").map(Number)
  const value = new Date(Date.UTC(year, month - 1, day))
  value.setUTCDate(value.getUTCDate() - count)
  return value.toISOString().slice(0, 10)
}

const normalizeIssueDate = (date: string) => date.replaceAll(".", "-")

export const selectRecentIssues = (
  issues: RelatedIssue[],
  referenceDate = ISSUE_REFERENCE_DATE,
) => {
  const firstIncludedDate = subtractCalendarDays(referenceDate, 29)
  const seenUrls = new Set<string>()
  return issues
    .filter(
      (issue) => {
        const publishedDate = normalizeIssueDate(issue.date)
        return (
          publishedDate >= firstIncludedDate && publishedDate <= referenceDate
        )
      },
    )
    .sort((a, b) =>
      normalizeIssueDate(b.date).localeCompare(normalizeIssueDate(a.date)),
    )
    .filter((issue) => {
      if (!issue.url) return true
      const normalizedUrl = issue.url.trim()
      if (seenUrls.has(normalizedUrl)) return false
      seenUrls.add(normalizedUrl)
      return true
    })
}

export const retryMockChart = async (
  product: Product,
  period: Period,
): Promise<ChartStatus> => {
  const outcome = product.history[period].retryResult ?? "error"
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  return outcome
}

export const validateProductData = (items: Product[]) =>
  items.flatMap((product) => {
    const issues: string[] = []
    const latestHalfMonth = product.history.halfMonth.points.at(-1)
    if (
      latestHalfMonth &&
      latestHalfMonth.fullLabel !== product.summary.period
    ) {
      issues.push(`${product.id}: 대표 가격 기간과 최신 반월 기간 불일치`)
    }
    if ((latestHalfMonth?.value ?? null) !== product.summary.price) {
      issues.push(`${product.id}: 대표 가격과 최신 반월 가격 불일치`)
    }
    Object.values(product.history).forEach((history) => {
      if (history.points.length) {
        const missingPointCount = history.points.filter(
          (point) => point.value === null,
        ).length
        if (missingPointCount !== history.quality.missingPoints) {
          issues.push(
            `${product.id}: 차트 결측 포인트와 품질 정보의 결측 개수 불일치`,
          )
        }
      }
      history.points.forEach((point) => {
        if (!point.insightId) return
        const insight = product.insights.find(
          (candidate) => candidate.id === point.insightId,
        )
        if (!insight) {
          issues.push(`${product.id}/${point.id}: Insight 참조 누락`)
        } else if (insight.period !== point.fullLabel) {
          issues.push(`${product.id}/${point.id}: Insight 분석 기간 불일치`)
        }
      })
    })
    return issues
  })

export const productDataValidationIssues = validateProductData(products)
