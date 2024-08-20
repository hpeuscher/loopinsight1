% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.


opts = delimitedTextImportOptions("NumVariables", 11);
opts.DataLines = [2, Inf];
opts.Delimiter = ",";
opts.VariableTypes = ["double", "double", "double", "double", "double", "double", "double", "double", "double", "double", "double"];

data_table = readtable("CircadianVariability.csv", opts);

data = table2array(data_table);

plot(data(:,1) / 60, data(:,2:end))
