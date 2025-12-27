import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { onboardingSteps, TOTAL_STEPS } from './onboarding/steps';
import { getIllustration } from './onboarding/illustrations';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('onboardingCurrentStep');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingCurrentStep', currentStep.toString());
  }, [currentStep]);

  const goToNextStep = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-[#006D40] to-[#00B067] transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Header with step counter and skip */}
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
          <div className={isFirstStep ? "mb-2" : "mb-4"}>
            {step.illustration && getIllustration(step.illustration)}
          </div>

          {/* Title - Special styling for first step */}
          <h2 className={`font-bold text-gray-900 mb-3 ${
            isFirstStep
              ? 'text-3xl text-center bg-gradient-to-r from-[#006D40] to-[#00B067] bg-clip-text text-transparent'
              : 'text-2xl'
          }`}>
            {step.title}
          </h2>

          {/* Description */}
          <p className={`text-gray-600 leading-relaxed mb-6 ${
            isFirstStep ? 'text-base text-center' : 'text-sm'
          }`}>
            {formatContent(step.content)}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          {/* Navigation buttons */}
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
                    ? 'bg-gradient-to-r from-[#006D40] to-[#00B067] text-white hover:from-[#005C36] hover:to-[#009055] shadow-lg shadow-green-500/30'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLastStep ? (
                "Inizia ad Usare l'App"
              ) : isFirstStep ? (
                'Scopri le Funzionalità'
              ) : (
                <>
                  Avanti
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Don't show again checkbox - only on last step */}
          {isLastStep && (
            <label className="flex items-center gap-2 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm text-gray-500">Non mostrare più all'avvio</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
