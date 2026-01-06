import { useState, useCallback } from 'react';
import { problemLogicsMap } from '@/app/(main)/issue_list/basic_info_b_problem/data/problem-logics';
import type { VariablesState, TraceStep } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import type { SerializableProblem } from '@/lib/data';

type TraceHistoryItem = {
    line: number;
    variables: VariablesState;
};

type UseTraceProblemProps = {
    problem: SerializableProblem | null;
    language: 'ja' | 'en';
};

export const useTraceProblem = ({ problem, language }: UseTraceProblemProps) => {
    const [currentTraceLine, setCurrentTraceLine] = useState(0);
    const [variables, setVariables] = useState<VariablesState>(problem?.initialVariables || {});
    const [traceHistory, setTraceHistory] = useState<TraceHistoryItem[]>([]);
    const [selectedLogicVariant, setSelectedLogicVariant] = useState<string | null>(null);
    const [isPresetSelected, setIsPresetSelected] = useState<boolean>(false);
    const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(null);

    // Initialize/Reset logic
    const initializeTrace = useCallback((initialVars: VariablesState, initialLine: number = 0) => {
        setVariables(initialVars);
        setCurrentTraceLine(initialLine);
        setTraceHistory([]);
        setIsPresetSelected(false);
        setSelectedLogicVariant(null);
        setSelectedPresetLabel(null);
    }, []);

    const handleNextTrace = useCallback(() => {
        if (!problem || !problem.programLines) return;

        const traceFinished = currentTraceLine >= 99 || (currentTraceLine >= (problem.programLines[language]?.length || 99));

        if (!traceFinished) {
            // 1. Save current state to history
            const currentSnapshot: TraceHistoryItem = {
                line: currentTraceLine,
                variables: JSON.parse(JSON.stringify(variables))
            };
            setTraceHistory(prev => [...prev, currentSnapshot]);

            const logic = problemLogicsMap[problem.logicType as keyof typeof problemLogicsMap];
            if (!logic) return;

            // 2. Determine next line
            let nextLine = currentTraceLine + 1;
            if ('calculateNextLine' in logic && logic.calculateNextLine) {
                nextLine = logic.calculateNextLine(currentTraceLine, variables, selectedLogicVariant);
            }

            // 3. Get trace step function
            let traceStepFunction: TraceStep | undefined = undefined;

            if ('getTraceStep' in logic && typeof (logic as any).getTraceStep === 'function') {
                traceStepFunction = (logic as any).getTraceStep(currentTraceLine, selectedLogicVariant);
            } else if ('traceLogic' in logic) {
                traceStepFunction = (logic as any).traceLogic[currentTraceLine];
            } else {
                console.error(`Logic for ${problem.logicType} has neither getTraceStep nor traceLogic.`);
                traceStepFunction = (vars) => vars;
            }

            const varsWithContext = { ...variables, currentLine: currentTraceLine, problemId: problem.id };
            const nextVariables = traceStepFunction ? traceStepFunction(varsWithContext) : { ...variables };

            setVariables(nextVariables);
            setCurrentTraceLine(nextLine);
        } else {
            console.warn("Trace attempted beyond program lines length.");
        }
    }, [problem, currentTraceLine, language, variables, selectedLogicVariant]);

    const handlePrevTrace = useCallback(() => {
        if (traceHistory.length === 0) return;
        const prevStep = traceHistory[traceHistory.length - 1];
        setVariables(prevStep.variables);
        setCurrentTraceLine(prevStep.line);
        setTraceHistory(prev => prev.slice(0, -1));
    }, [traceHistory]);

    const handleResetTrace = useCallback(() => {
        if (!problem) return;
        const initialLine = problem.id === '28' ? 4 : 0;

        setVariables({
            ...problem.initialVariables,
            problemId: problem.id,
            initialized: false,
            _variant: undefined // explicitly reset variant
        });
        setCurrentTraceLine(initialLine);
        setTraceHistory([]);
        setIsPresetSelected(false);
        setSelectedLogicVariant(null);
        setSelectedPresetLabel(null);
    }, [problem]);

    const handleSetLogicVariant = useCallback((variantId: string) => {
        setSelectedLogicVariant(variantId);
        setVariables((prev) => ({
            ...prev,
            _variant: variantId,
        }));
        setCurrentTraceLine(0);
    }, []);

    const handleSetData = useCallback((dataToSet: Record<string, any>, label: string = "") => {
        if (!problem) return;
        const cleanVariables = JSON.parse(JSON.stringify(problem.initialVariables));

        setVariables((prev) => ({
            ...cleanVariables,
            ...dataToSet,
            _variant: selectedLogicVariant, // Maintain selected logic variant
            initialized: false,
            problemId: problem.id
        }));
        setCurrentTraceLine(0);
        setTraceHistory([]);
        setIsPresetSelected(true);
        setSelectedPresetLabel(label);
    }, [problem, selectedLogicVariant]);

    const handleSetNum = useCallback((num: number) => {
        if (!problem) return;
        setVariables({ ...problem.initialVariables, num: num, initialized: false, problemId: problem.id });
        setCurrentTraceLine(0);
        setTraceHistory([]);
        setIsPresetSelected(true);
        setSelectedLogicVariant(null);
        setSelectedPresetLabel(String(num));
    }, [problem]);

    return {
        currentTraceLine,
        variables,
        traceHistory,
        selectedLogicVariant,
        isPresetSelected,
        selectedPresetLabel,
        handleNextTrace,
        handlePrevTrace,
        handleResetTrace,
        handleSetLogicVariant,
        handleSetData,
        handleSetNum,
        setVariables,        // Expose setter for special cases (e.g. initialization in useEffect)
        setCurrentTraceLine, // Expose setter
        setTraceHistory,     // Expose setter
        setIsPresetSelected  // Expose setter
    };
};
