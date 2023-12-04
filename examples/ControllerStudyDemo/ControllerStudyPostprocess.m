% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.

clearvars;

% add util path which contains importJsonData
addpath('../util/')
% import JSON file
simDataJson = fileread('ControllerStudyResults.json');
% decode JSON file
simData = jsondecode(simDataJson);

%% prepare figure
clf(); set(gcf, 'Color', 'w', 'Position', [100 100 750 500]);
tiledlayout(2,1);
ax1 = nexttile(); set(ax1, 'NextPlot', 'add');
ax2 = nexttile(); set(ax2, 'NextPlot', 'add');


%% process data
for i=1:length(simData)
    data = simData(i);
    
    % import data
    [t, y, s, c, u, x] = importJsonData(data.results);
    
    % hide zero boluses in diagram
    c.ibolus(c.ibolus==0) = NaN;

    % plot blood glucose and insulin infusion rate
    h = plot(ax1, t, y.Gp, 'DisplayName', data.id);
    stairs(ax2, t(~isnan(c.iir)), c.iir(~isnan(c.iir)), 'Color', h.Color);
    plot(ax2, t, c.ibolus, '^',  ...
        'MarkerEdgeColor', 'k', 'MarkerFaceColor', h.Color);
end

%% format graphs
axes(ax1); 
title('glucose concentration in mg/dl'); 
hold on; box on; grid on;
legend('show', 'Location', 'northwest')

axes(ax2); 
title('insulin infusion: basal rate in U/h and bolus in U'); 
hold on; box on; grid on;

%% store as file
print('ControllerStudyDemo.png', '-dpng', '-r300');
