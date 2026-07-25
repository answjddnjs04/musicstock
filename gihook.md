# 📋 [MVP 기획서] 음악 가상 트레이딩 웹 "MusicStock (가칭)"

## 1. 프로젝트 개요 & 디자인 시스템

### 🎯 목표
- 음원 스트리밍/조회수를 매출(배당)로 전환하는 가상 트레이딩 게임의 최소 기능(MVP) 검증.
- 싸구려 웹처럼 보이지 않도록 감성적인 Dark Synth 톤앤매너 적용.

### 🎨 디자인 컬러 팔레트 (CSS Color Specs)
- **Main Background**: Deep Charcoal Navy (`#0B0E14`) — 세련되고 깔끔한 다크 베이스
- **Card & Surface Background**: Dark Slate (`#161B26`) — 카드 및 콘텐츠 영역 구분
- **Primary / Rise (상승 & 배당)**: Neon Mint Green (`#00FF87`) — 수익/긍정적 상태 강조
- **Secondary / Fall (하락)**: Neon Electric Pink (`#FF2E93`) — 음악 감성 + 감가/하락 상태
- **Text / Accent**: Pure White (`#FFFFFF`) / Muted Gray (`#8A94A6`)

## 2. 필수 데이터 구조 (Single Data Model)

단순한 모의 데이터(Mock Data) 기반으로 시작하되, 서비스 작동에 필수적인 최소 필드만 구성합니다.

```json
{
  "song_id": "song_01",
  "title": "Hype Boy",
  "artist": "NewJeans",
  "album_cover": "https://...",
  "current_price": 12500,        // 현재 주가 (가상화폐 '콩')
  "daily_views_growth": 450000,  // 오늘 증가한 조회수 (배당의 원천)
  "dividend_yield_ratio": 4.2,   // 주가 대비 예상 배당률 (%)
  "price_change_rate": 3.5       // 어제 대비 주가 변동률 (%)
}
```

## 3. 화면별 최소 핵심 기능 (MUST-HAVE Only)

### 📱 화면 1: 메인 탐색 & 전광판 (Home & Market)
싸구려처럼 보이지 않게 하는 핵심은 **'실시간으로 살아 움직이는 느낌'**을 주는 것입니다.

- **최상단 Ticker Bar**: 텍스트 롤링 애니메이션으로 `$HypeBoy ▲3.5% | $Dynamite ▼1.2% | $APT. ▲8.4%` 실시간 전광판 노출.
- **큐레이션 탭 3가지** (카드/리스트 뷰):
  - 🔥 **급등주**: 오늘 조회수/주가 상승률 TOP 3
  - 💎 **효자주 (고배당)**: 주가 대비 배당 수익률(ROI) TOP 3
  - 👑 **대장주**: 가장 거래량이 많고 몸값이 높은 음원 TOP 3
- **음악 카드 컴포넌트**: 앨범 커버, 곡명/아티스트, 현재가, 변동률(네온 민트/핑크), [매수/매도] 버튼.

### 📱 화면 2: 내 포트폴리오 & 음악 영수증 (My LP & Receipt)
- **내 LP 장식장 (My Portfolio)**: 내가 보유한 음원 리스트를 앨범 아트워크 카드 형태로 정렬. 카드 상단에 '내일 예상 배당금' Live 게이지 표시 (`"오늘 밤 예상: +1,250 콩"`).
- **접속 시 '음악 영수증' 팝업 (Receipt Modal)**: 접속하자마자 어두운 배경 위로 영수증 스타일의 모달 팝업 출현.
  - 내용: 어제 총 적립 배당금, 어제 제일 열일한 효자 곡명, 오늘 적용 수수료율.
  - 하단 [영수증 자랑하기(캡쳐/공유)] 버튼 탑재.

### 📱 화면 3: 핵심 매매 모달 & 동적 수수료 (Trading Engine)
- **매수 / 매도 Pop-up**: 보유 잔고, 구매 희망 주수 입력, 예상 수수료 계산 결과 표시.
- **오늘의 동적 수수료율 안내 뱃지**: 화면 구석에 `오늘의 거래 수수료율: 1.8% (인플레이션 반영됨)` 미니 뱃지 고정.

## 4. 백엔드 로직 핵심 규칙 (Logic Blueprint)

신입 개발자가 구현해야 할 간단한 하루 주기(Daily Cycle) 로직입니다.

- **배당금 산정 (밤 12시 정산)**:
  `유저 지급 배당금 = 음원의 당일 증가 조회수 × 지분율 × 기본 배당 계수`
- **동적 수수료율 업데이트**:
  `당일 인플레이션율 = 오늘 시스템 전체에 풀린 총 배당금 / 전체 시장 유통 통화량`
  인플레이션율이 높아지면 → 내일의 거래 수수료율 상승 (최대 5% 제한).

## 5. Claude 전달용 프롬프트 (신입 개발자 전달 메시지)

신입 개발자가 Claude에 입력해 코드를 뽑아낼 수 있도록 작성된 템플릿입니다.

> 우리는 '음악의 실제 스트리밍/조회수를 기업 매출(배당금)로 치환하여 거래하는 가상 주식 트레이딩 웹 앱'의 MVP를 제작 중이야.
> 디자인: Dark Synth 스타일 (배경 #0B0E14, 카드 #161B26, 상승/배당 #00FF87, 하락 #FF2E93).
> 주요 화면: 상단 실시간 주가 텍스트 Ticker, 급등주/고배당주/대장주 음원 리스트 카드, 내 LP 포트폴리오 및 '내일 예상 배당금' 표시 영역, 앱 접속 시 열리는 '음악 영수증(Music Receipt)' 모달 팝업.
> 기술 스택: React + Tailwind CSS (또는 HTML/JS + Tailwind)로 한 페이지 내에서 깔끔하게 동작하는 Single Page 구조로 UI와 데이터 상태관리가 포함된 코드를 작성해 줘.

## 6. 구현 10단계 로드맵 (Implementation Roadmap)

뒷단계가 앞단계에만 의존하도록 짜여 있습니다. **데이터 → 상태 → 공용 컴포넌트 → 화면 → 부가 로직 → 통합** 순으로 진행하면 나중에 앞단계 구조를 다시 뜯어고치는 일이 없습니다.

1. **데이터 모델 & Mock 데이터**
   `src/data/mockSongs.js`에 2번 항목의 필드를 가진 Mock 음원 10곡 내외 작성, `src/data/mockUser.js`에 잔고·보유 포트폴리오 Mock 데이터 작성. 이후 모든 화면은 이 형태만 소비하도록 고정.

2. **디자인 토큰 & 공용 스타일 정리**
   `src/index.css`의 `@theme` 색상 토큰에 spacing/radius/font 토큰 보강, 반복될 유틸 클래스 조합 정리.

3. **전역 상태 관리 설계**
   `src/context/AppContext.jsx`에 Context + `useReducer`로 `songs`, `portfolio`, `balance`, `feeRate` 상태와 `buySong`, `sellSong`, `settleDaily` 액션 정의. UI 없이 로직만 먼저 검증.

4. **공용 레이아웃 & 내비게이션**
   `src/components/layout/AppShell.jsx`: Ticker Bar 자리, 본문 영역, 하단 탭바(홈/포트폴리오) 뼈대. 화면 전환은 `useState`로 관리 (react-router 불필요).

5. **음악 카드 컴포넌트 (공용)**
   `src/components/MusicCard.jsx`: 앨범 커버, 곡명/아티스트, 현재가, 변동률(민트/핑크), [매수/매도] 버튼. `variant="card" | "list"` props로 화면 1·2에서 재사용.

6. **화면 1: 홈 & 마켓**
   Ticker Bar 롤링 애니메이션, 큐레이션 탭 3종(정렬 로직은 `src/lib/rankings.js`로 분리), `MusicCard` 리스트 렌더링. [매수/매도] 버튼은 7단계 모달을 여는 트리거로 연결.

7. **매매 모달 & 동적 수수료**
   `src/components/TradingModal.jsx`: 잔고·수량 입력·예상 수수료 미리보기, 확정 시 3단계 액션 호출. `src/lib/fee.js`에 인플레이션율→수수료율(최대 5%) 계산 로직 구현, 수수료율 미니 뱃지도 함께 추가.

8. **화면 2: 내 포트폴리오 (My LP)**
   `portfolio` 상태를 `MusicCard`(list variant)로 렌더링. '내일 예상 배당금' 게이지는 `src/lib/dividend.js`의 배당 계산 함수로 표시.

9. **접속 시 음악 영수증 모달 + 일일 정산 로직**
   `src/lib/dividend.js`를 3단계 `settleDaily` 액션과 연결. `src/components/ReceiptModal.jsx`: 첫 진입 시 자동 오픈, 어제 배당금/효자 곡/오늘 수수료율 표시, [영수증 자랑하기] 버튼(공유는 스텁으로 우선 처리).

10. **통합 · 반응형 · 배포 점검**
    `App.jsx`에서 4·6·7·8·9단계를 최종 연결, 전체 플로우(접속→영수증→홈 탐색→매수→포트폴리오 확인) 수동 테스트. 모바일 반응형 점검, `npm run build` 확인 후 Cloudflare Pages배포.
