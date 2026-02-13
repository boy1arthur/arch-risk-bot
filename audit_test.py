import os
def insecure_code():
    os.system('ls -la')

def another_risk():
    eval("print('hello')")
    import subprocess
    subprocess.run("ls", shell=True)
    exec("print('dangerous')")
 # 분석 대상 코드 - 최종 확인용 완료
