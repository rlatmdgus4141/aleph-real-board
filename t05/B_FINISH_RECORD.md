# T05 B 종료·인계 기록 (AI B)

## 1. 목표
서울 기온 정보판에 '실제 일별 기록 CSV 내려받기'를 완성한다. 열 7개 고정: 날짜·기온·단위·출처·출처 URL·출처 시각·조회 시각. 합성 기록 제외. 고정 검사 CSV-01~10 유지.
입력 인수인계문: T05_A_restart_HANDOFF_FINAL.txt (A 종료/B 시작 소스 63599a8e75eca8cdd810a07b75e9ba07119a2ab9).

## 2. 현재 상태
- B 시작 commit: 63599a8e75eca8cdd810a07b75e9ba07119a2ab9
- 구현 commit: ced80e6ae73121d8d68b974c1d496c09618920fc (index.html만 변경)
- 이 기록·재현 결과 commit: 이 파일을 포함하는 다음 로컬 커밋 (git log 참조)
- 변경 내용: 보존 기록·공개본 탭의 export-json 옆에 `#export-csv` 버튼 추가, `exportRealRecordsCSV()` 추가, `$('export-csv').onclick` 연결. live.daily_readings의 row.reading만 사용하며 replay는 읽지 않는다. 0건이면 토스트 '내려받을 실제 기록이 없습니다' 후 종료. 파일명 seoul-real-records.csv. 모든 실제 일별 기록을 내보낸다(JSON은 최신 2건, CSV는 전체).
- 재사용한 자료(이번 실행 신규 작성 아님): A의 buildRealRecordsCSV(readings) 함수, 고정 검사 t05/test-csv.cjs, A의 인수인계문. A 인수인계문에 따르면 이 함수·검사 파일은 이전 폐기 시도에서 가져온 것이다.
- 이전 실행의 시간·검사 결과는 이번 결과로 사용하지 않았다. 아래 결과는 모두 이번 B 세션에서 새로 실행한 것이다.
- official-files, public-evidence 스크립트 블록은 시작 commit과 문자열 동일함을 확인했다. 기존 실제 조회·JSON·HTML 다운로드·합성 검사 코드는 수정하지 않았다.

## 3. 실행 명령
필요: Node.js, Git (npm 설치·API 키 불필요). 이번 실행 환경은 Node v22.22.0이며 A 문서의 24.x와 다르다. 검사는 이 버전에서 실행되었다.
```sh
git clone <repo> t05-session-b && cd t05-session-b
git checkout --detach ced80e6ae73121d8d68b974c1d496c09618920fc
node t05/test-csv.cjs > t05/out.json; echo $?     # 고정 검사 10개
node t05/browser-check.cjs                        # 실제 Chromium 검사 (Playwright + 설치된 Chromium 필요)
```

## 4. 통과 검사 (이번 실행의 실제 결과 파일)
| 회차 | 파일 | 소스 | 결과 |
|---|---|---|---|
| 고정 1 (구현 전, B 시작 상태) | t05/b-results-round-1.json | 63599a8 | 0/10 PASS, 종료코드 1 (FAIL) |
| 고정 2 (구현 후) | t05/b-results-round-2.json | 구현 작업트리 (= ced80e6 index.html) | 10/10 PASS, 종료코드 0 |
| 고정 3 (새 폴더 재현) | t05/b-results-round-3-fresh-folder.json | ced80e6 | 10/10 PASS, 종료코드 0 |
- 고정 검사 파일 SHA-256 f6e343e5303ce99a6e6fffe3e311ba4dda0670b631a4e56b084fdc740450f0aa 유지(삭제·완화·기대값 변경 없음).
- 오류 회차(고정 검사 FAIL이 하나라도 나온 B 실행 회차): 1회(구현 전 시작 상태 확인 실행). 구현 후 회차는 0.
- 실제 브라우저 검사(Chromium 141, file:// 로 열기) — 보조 검사이며 고정 검사 CSV-01~10이 아님:
  - t05/b-browser-round-1.json: 오류 종료(제품 결함이 아닌 검사 스크립트 결함 — 버튼이 있는 보존 기록 탭으로 전환하지 않음). 스크립트만 수정.
  - t05/b-browser-round-2.json: 6/6 PASS. t05/b-browser-round-3-fresh-folder.json: 새 폴더에서 6/6 PASS.
  - 확인한 것: 실제 .csv 파일 다운로드, UTF-8 BOM·한글 헤더, 7열·날짜 오름차순(2026-09-30 24 / 2026-10-01 17.3), 빈 기록 시 토스트와 다운로드 없음, 기록 포함 공개본 HTML을 내려받아 다시 열어도 CSV 버튼 동작, JSON 다운로드 유지, 합성 재생 후에도 CSV에 합성 기록 없음.
- 미실행(통과로 기록하지 않음): 실제 API 재조회(보존 기록을 바꾸지 않기 위해 실행 안 함), 공식 합성 검사 '전체 실행' 버튼의 브라우저 실행, 좁은 화면 레이아웃 시각 검사, 사용자 개인 브라우저에서의 확인.

## 5. 남은 문제
- 사용자 작업 요청 수(B 세션): 2회 (최초 구현 요청 1회 + push 요청 1회). 내부 도구 호출은 제외.
- 시간은 두 값을 구분한다. (a) 도구 실행시간: B가 관측한 첫 도구 실행 2026-10-02T00:32:25Z ~ 마지막 검사 00:34:01Z, 약 1분 36초 — 공식 사용 시간이 아니다. (b) 공식 사용 시간: 플랫폼의 B 시작부터 B 종료 기록까지(중단 시간 포함)이며 사용자가 플랫폼 기록으로 확인해 입력한다. B는 이 값을 알 수 없고 추정하지 않았다.
- 플랫폼에 등록한 서비스·모델명은 사용자가 확정한다. 순차 인계이므로 통과 수만으로 모델 성능 우열을 주장할 수 없다.
- 공개 SHA/고정 URL은 push 후 사용자에게 응답으로 전달한다(이 파일은 자기 자신의 SHA를 담을 수 없다).
- 실행 환경 Node가 22.22.0이었다(문서상 24.x).

## 6. 다음 행동
1. 사용자가 실제 브라우저에서 CSV 다운로드·빈 기록·한글(엑셀에서 열기)을 한 번 확인한다.
2. 두 도구 이름을 가린 측정표에 위 4항 수치를 넣는다. 사용자 판단은 지어내지 않는다.

## 7. 건드리지 말 것
고정 검사 10개와 t05/test-csv.cjs(해시 유지), 기존 실제 조회·JSON/HTML 다운로드·합성 검사, official-files, public-evidence, A의 결과 파일(a-results-*.json)과 HANDOFF_DRAFT.md. 실제 API로 재조회해 보존 기록을 바꾸지 않는다. 비밀값·개인정보·대화 전문을 넣지 않는다.
