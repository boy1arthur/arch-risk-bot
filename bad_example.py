# intentionally bad example for demo

import os
import sys
import math
import json
import random
import datetime
import subprocess

def massive_function():
    data = []
    for i in range(1000):
        for j in range(1000):
            data.append(i*j)
    return sum(data)

def another_massive_function():
    return massive_function()
