% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.

clearvars

% add util path which contains importJsonData
addpath('../util/')
% import JSON file
simDataJson = fileread('ExerciseModelsComparison.json');
% decode JSON file
simData = jsondecode(simDataJson);


%% prepare figure
clf(); set(gcf, 'Color', 'w', 'Position', [100 100 750 500]);
ax1 = gca; hold on;

%% process data
dateFormat = '%4u-%2u-%2uT%2u:%2u:%fZ';
for i=1:length(simData)
    data = simData(i);
    % import data
    [t, y, s, c, u, x] = importJsonData(data.results);

    % hide zero boluses in diagram
    c.ibolus(c.ibolus==0) = NaN;
    
    % plot blood glucose
    h = plot(ax1, minutes(t-t(1))/60, y.Gp, 'DisplayName', data.id);
end

%% format graphs

set(gcf, 'Position', [100 100 500 230]);
axes(ax1); 
hold on; box on; grid on;
legend('show', 'Location', 'east', 'Interpreter', 'none')
set(ax1, 'FontName', 'Calibri Light', 'FontSize', 10);
set(ax1, 'Xtick', 0:6:48, 'XTickLabels', {'0:00', '6:00', '12:00', '18:00', '0:00', '6:00', '12:00', '18:00', ''} );
set(ax1, 'Position', [0.12 0.2 0.86 0.75]);
xlim([12 48]); ylim([75 125])
xlabel('time in h');
ylabel('glucose concentration in mg/dl'); 

% store as file
print('ExerciseModelsComparison.png', '-dpng', '-r300');
