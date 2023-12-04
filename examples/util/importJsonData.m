function [t, y, s, c, u, x] = importJsonData(results)
% [t, y, s, c, u, x] = importJsonData(results)
% Imports simulation results from JSON file.
% Outputs:
%   t: time as datetime
%   y: patient output as timetable
%   s: measurements as timetable
%   c: controller output as timetable
%   u: patient input as timetable
%   x: patient state as timetable

% This file is part of LoopInsighT1, an open source tool to
% simulate closed-loop glycemic control in type 1 diabetes.
% Distributed under the MIT software license.
% See https://lt1.org for further information.

    t = extractTimestamps(results);
    y = extractDataseries(results, t, 'y');
    s = extractDataseries(results, t, 's');
    c = extractDataseries(results, t, 'c');
    u = extractDataseries(results, t, 'u');
    x = extractDataseries(results, t, 'x');
    
    %% utility function to extract timestamps
    function t = extractTimestamps(results)
        tRaw = [results.t];
        % fast extraction of JSON date
        t = sscanf(tRaw, '%4u-%2u-%2uT%2u:%2u:%fZ');
        % convert to datetime
        t = datetime(reshape(t, 6, [])');
    end
    

    %% utility function to import data series
    function s = extractDataseries(results, t, signal, entries)
        signal = {results.(signal)};
        if nargin < 4 || isempty(entries)
            % no signal entries were specified
            % -> extract ALL entries of this signal
            entries = fields(signal{1});
        end
        if ischar(entries)
            % single entry was passed as a string -> convert to cell
            entries = {entries};
        end
        % prepare struct to collect data
        s = struct();
        for i=1:length(entries)
            e = entries{i};
            s.(e) = cellfun(@(s) extractEntry(s, e), signal);
            % convert to row vector
            s.(e) = s.(e)(:);
        end
        sTab = struct2table(s);
        % replace empty cells with NaN
        s = table2cell(sTab);
        s(cellfun(@(r) length(r)<1, s)) = {NaN};
        % convert back to table
        sTab = cell2table(s, 'VariableNames', sTab.Properties.VariableNames);
        s = table2timetable(sTab, 'RowTimes', t);
    end

    %% utility function to extract entry from signal, if present
    function entry = extractEntry(signal, entryName)
        try
            entry = signal.(entryName);
            if isempty(entry)
                entry = NaN;
            end
        catch
            entry = NaN;
        end
    end

end