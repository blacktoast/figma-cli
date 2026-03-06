# figma-cli

Figma 디자인을 터미널에서 조회하고 스크린샷을 받을 수 있는 CLI 도구.

## 설치

```bash
./install.sh
```

Node.js 18+ 와 npm이 필요합니다. 스크립트가 의존성 설치, 빌드, 글로벌 링크를 자동으로 수행합니다.

`Permission denied` 에러가 발생하면 실행 권한을 먼저 부여하세요:

```bash
chmod +x install.sh uninstall.sh
```

## 제거

```bash
./uninstall.sh
```

## Figma Personal Access Token 발급 방법

figma-cli를 사용하려면 Figma Personal Access Token이 필요합니다.

### 1. Figma 웹사이트에서 토큰 생성

1. [Figma](https://www.figma.com)에 로그인
2. 좌측 상단 프로필 아이콘 클릭 > **Settings** 선택
3. 스크롤을 내려 **Personal access tokens** 섹션으로 이동
4. **Generate new token** 클릭
5. 토큰 이름을 입력하고 (예: `figma-cli`), 필요한 scope를 설정:
   - **File content** — Read only (inspect, screenshot에 필요)
   - **Variables** — Read only (디자인 토큰 조회에 필요)
   - **Comments** — Read only (`--comments` 옵션 사용 시 필요)
6. **Generate token** 클릭
7. 생성된 토큰을 복사 (이 화면을 벗어나면 다시 볼 수 없음)

### 2. 토큰 등록

**방법 A: `init` 명령어 사용 (권장)**

```bash
figma-cli init
```

프롬프트에 토큰을 입력하면 자동으로 검증 후 `~/.figma-cli/config.json`에 저장됩니다.

**방법 B: 환경변수 사용**

```bash
export FIGMA_TOKEN="figd_xxxxxxxxxxxxxxxxx"
```

`.bashrc`, `.zshrc` 등에 추가하면 영구 적용됩니다.

## 사용법

```bash
# 토큰 설정
figma-cli init

# 노드 조회 (JSON 출력)
figma-cli inspect <figma-url>

# 노드 조회 (트리 텍스트 출력)
figma-cli inspect <figma-url> --plain

# 코멘트 포함 조회
figma-cli inspect <figma-url> --comments

# 스크린샷 URL 가져오기
figma-cli screenshot <figma-url>

# 스크린샷을 파일로 저장
figma-cli screenshot <figma-url> --format png --scale 2 --save output.png
```

### Screenshot 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--format` | `png`, `jpg`, `svg`, `pdf` | `png` |
| `--scale` | 0.01 ~ 4 | 1 |
| `--save <path>` | 이미지를 파일로 저장 | (URL만 출력) |
