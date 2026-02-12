# Arch Risk Bot - E2E Test Sample
# 이 파일은 가이드에 따라 PR을 생성할 때 복사하여 사용하세요.

# 1. Syntax Error (분석기가 즉시 탐지해야 함)
# 아래 줄의 콜론(:)이 누락되어 구문 에러를 유발합니다.
def calculate_metrics(data)
    return [d * 2 for d in data]

# 2. Hotspot / God Object (Architecture Risk)
# 파일이 너무 크거나 복잡도가 높을 때 'Root is cluttered' 또는 'Hotspots' 경고를 발생시킵니다.
def complex_logic_1():
    pass

def complex_logic_2():
    pass

# ... (실제 테스트 시에는 이 함수들을 반복하여 파일 크기를 키우면 더 정확한 탐지가 가능합니다) ...
