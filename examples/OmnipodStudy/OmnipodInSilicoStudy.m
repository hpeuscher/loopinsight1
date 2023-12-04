% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.

clearvars
close all

% add util path which contains importJsonData
addpath('../util/')
% import and decode JSON file with results
simDataJson = fileread('OmnipodInSilicoStudy.json');
simData = jsondecode(simDataJson);

%% prepare figure
clf(); set(gcf, 'Color', 'w', 'Position', [100 100 750 500]);
ax1 = axes(); set(ax1, 'NextPlot', 'add');
xlabel("average basal rate in U/h")
ylabel("amplitude of BG oscillation in mg/dl")


%% process data
groups = {'adult', 'adolescent', 'child'};
colors = {[0 0 1], [1 0 0], [0.8 0.8 0]};

for g = 1:length(groups)
    % prepare figure for this group of virtual patients
    figure; set(gcf, 'Color', 'white');
    tiledlayout(4,3)

    for i=1:10
        % extract simulation data for this virtual patient
        patientName = sprintf('%s_%03u', groups{g}, i);
        [t, y, s, c, u, x] = importData(simData.(patientName).results);
        
        % compute amplitude of oscillation
        mx = max(y.Gp(round(end/2):end));
        mn = min(y.Gp(round(end/2):end));
        ampl = (mx-mn)/2;
        
        % add mark in overview diagram
        plot(ax1, simData.(patientName).patient.profile.IIReq, ampl, ...
            'x', 'Color', colors{g});
        
        % plot time signals in a separate diagram
        nexttile
        title(simData.(patientName).id); hold on; box on;
        plot(hours(t-t(1)), y.Gp, 'k')
        ylabel('G in mg/dl');
        yyaxis right
        plot(hours(t-t(1)), u.iir);
        ylabel('IIR in U/h');
        xlabel('time in h');
        set(gca, 'XTick', 0:12:60);
    end
end

linkaxes(get(get(gcf, 'Children'), 'Children'), 'x')
