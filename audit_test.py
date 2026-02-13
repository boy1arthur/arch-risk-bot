import os
def insecure_code():
    os.system('ls -la')

def another_risk():
    eval("print('hello')")
 # 분석 대상 코드
