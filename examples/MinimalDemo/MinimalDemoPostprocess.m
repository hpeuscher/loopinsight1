% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.

clearvars

% add util path which contains importJsonData
addpath('../util/')
% import JSON file
simDataJson = fileread('MinimalDemoResults.json');
% decode JSON file
simData = jsondecode(simDataJson);


%% process data

% import data
[t, y, s, c, u, x] = importJsonData(simData.results);
% hide zero boluses in diagram
c.ibolus(c.ibolus==0) = NaN;


%% prepare figure and plot
clf(); set(gcf, 'Color', 'w', 'Position', [100 100 750 500]);
tiledlayout(2,1);

% plot blood glucose
ax1 = nexttile(); set(ax1, 'NextPlot', 'add'); box on; grid on;
plot(ax1, t, y.Gp, 'DisplayName', 'actual blood glucose');
plot(ax1, t, s.CGM, '.', 'DisplayName', 'CGM measurement');
title('glucose concentration in mg/dl'); 
legend('show', 'Location', 'northeast')

% plot insulin infusion rate
ax2 = nexttile(); set(ax2, 'NextPlot', 'add'); box on; grid on;
stairs(ax2, t, c.iir, 'DisplayName', 'command from controller');
stairs(ax2, t, u.iir, 'DisplayName', 'actual pump output');
plot(ax2, t, c.ibolus, '^', 'DisplayName', 'bolus', ...
    'MarkerEdgeColor', 'k');
ylim([0, 5]);
legend('show', 'Location', 'northeast')
title('insulin infusion: basal rate in U/h and bolus in U'); 


%% store as file
print('MinimalDemo.png', '-dpng', '-r300');
