# This file is part of LoopInsighT1, an open source tool to
# simulate closed-loop glycemic control in type 1 diabetes.
# Distributed under the MIT software license.
# See https://lt1.org for further information.


import matplotlib.pyplot as plt
import numpy as np
import csv

with open('CircadianVariability.csv', 'r', newline='') as csvfile:
    reader = csv.reader(csvfile)
    data = list(reader)
    csvfile.close()

    
data_array = np.array(data[1:], dtype=float)
for i in range(1,len(data[0])):
    print(i)
    plt.plot(data_array[:,0]/60, data_array[:,i])
        
plt.show()
    
