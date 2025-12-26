import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { onboardingSteps, TOTAL_STEPS, OnboardingStepConfig } from './onboarding/steps';
import { getIllustration } from './onboarding/illustrations';
import OnboardingSpotlight from './OnboardingSpotlight';

interface OnboardingTutorialProps {
  onComplete: () => void;
  onDateSelect?: (date: Date) => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  onComplete,
  onDateSelect
}) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('onboardingCurrentStep');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [waitingForInteraction, setWaitingForInteraction] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingCurrentStep', currentStep.toString());
  }, [currentStep]);

  // Handle interaction detection for interactive steps
  useEffect(() => {
    if (!step.requiresInteraction || !showSpotlight) return;

    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      const targetElement = step.highlightTarget ? document.querySelector(step.highlightTarget) : null;

      if (targetElement && (targetElement.contains(target) || targetElement === target)) {
        setWaitingForInteraction(false);
        setShowSpotlight(false);

        // Small delay to let the interaction complete
        setTimeout(() => {
          goToNextStep();
        }, 300);
      }
    };

    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('touchend', handleInteraction, true);

    return () => {
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchend', handleInteraction, true);
    };
  }, [step, showSpotlight, currentStep]);

  const goToNextStep = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
      setShowSpotlight(false);
      setWaitingForInteraction(false);
    }
  }, [isLastStep]);

  const goToPrevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      setShowSpotlight(false);
      setWaitingForInteraction(false);
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboardingCompleted', 'true');
    }
    localStorage.removeItem('onboardingCurrentStep');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.removeItem('onboardingCurrentStep');
    onComplete();
  };

  const handleTryIt = () => {
    setShowSpotlight(true);
    setWaitingForInteraction(true);
  };

  const handleContinueWithoutTrying = () => {
    goToNextStep();
  };

  // Format content with line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Spotlight overlay for interactive steps */}
      <OnboardingSpotlight
        targetSelector={step.highlightTarget}
        hint={waitingForInteraction ? step.interactionHint : undefined}
        active={showSpotlight}
      />

      {/* Main modal - hidden when spotlight is active and waiting for interaction */}
      {!waitingForInteraction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Header with close/skip */}
            <div className="flex items-center justify-between px-6 pt-4">
              <span className="text-xs font-medium text-gray-400">
                Passo {currentStep + 1} di {TOTAL_STEPS}
              </span>
              <button
                onClick={handleSkip}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SkipForward size={14} />
                Salta
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {/* Illustration */}
              <div className="mb-4">
                {step.illustration && getIllustration(step.illustration)}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {formatContent(step.content)}
              </p>

              {/* Interaction hint badge */}
              {step.requiresInteraction && !showSpotlight && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    {step.interactionHint}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-3">
              {/* Interactive step buttons */}
              {step.requiresInteraction && !showSpotlight ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleTryIt}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Prova Ora
                  </button>
                  <button
                    onClick={handleContinueWithoutTrying}
                    className="py-3 px-4 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all"
                  >
                    Salta
                  </button>
                </div>
              ) : (
                /* Regular navigation buttons */
                <div className="flex gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={goToPrevStep}
                      className="py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center gap-1"
                    >
                      <ChevronLeft size={18} />
                      Indietro
                    </button>
                  )}
                  <button
                    onClick={isLastStep ? handleComplete : goToNextStep}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      isLastStep
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                        : isFirstStep
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isLastStep ? (
                      "Inizia ad Usare l'App"
                    ) : isFirstStep ? (
                      'Inizia Tour'
                    ) : (
                      <>
                        Avanti
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Don't show again checkbox - only on last step */}
              {isLastStep && (
                <label className="flex items-center gap-2 cursor-pointer justify-center">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">Non mostrare più all'avvio</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating button to return to modal when spotlight is active */}
      {waitingForInteraction && (
        <button
          onClick={() => {
            setShowSpotlight(false);
            setWaitingForInteraction(false);
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] bg-white rounded-full px-6 py-3 shadow-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 animate-bounce"
        >
          <X size={18} />
          Torna al Tutorial
        </button>
      )}
    </>
  );
};

export default OnboardingTutorial;
