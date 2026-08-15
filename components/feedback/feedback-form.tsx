'use client';

import { useState } from 'react';
import { submitFeedback } from '@/app/actions/feedback';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeedbackForm({ sessionId }: { sessionId: string }) {
  const t = useTranslations('feedback-form');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [feelingInArms, setFeelingInArms] = useState('');
  const [overallExperience, setOverallExperience] = useState('');
  const [feltSupported, setFeltSupported] = useState('');
  const [feltSupportedDetails, setFeltSupportedDetails] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [continueProcess, setContinueProcess] = useState('');
  const [interestedInLearning, setInterestedInLearning] = useState(false);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1:
        return feelingInArms.trim().length > 0;
      case 2:
        return overallExperience.trim().length > 0;
      case 3:
        if (!feltSupported) return false;
        if (feltSupported === 'Other' && feltSupportedDetails.trim().length === 0) return false;
        return true;
      case 4:
        return additionalComments.trim().length > 0;
      case 5:
        return continueProcess.length > 0;
      case 6:
        return true; // Checkbox is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  async function handleSubmit() {
    if (!canProceed()) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('feelingInArms', feelingInArms);
    formData.append('overallExperience', overallExperience);
    formData.append('feltSupported', feltSupported);
    formData.append('feltSupportedDetails', feltSupportedDetails);
    formData.append('additionalComments', additionalComments);
    formData.append('continueProcess', continueProcess);
    formData.append('interestedInLearning', interestedInLearning ? 'true' : 'false');

    try {
      const result = await submitFeedback(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || t('thereWasAnErrorSubmittingYourFeedback'));
      }
    } catch (err) {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">{t('thankYou')}</h2>
        <p className="text-muted-foreground">{t('feedbackSubmitted')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Progress Bar Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground font-medium">
          <span>{t('question')} {step} {t('of')} {totalSteps}</span>
          <span>{Math.round(progress)}% {t('completed')}</span>
        </div>
        <Progress value={progress} className="h-2 w-full transition-all duration-500" />
      </div>

      <div className="min-h-[250px] flex flex-col justify-center animate-in slide-in-from-right-4 fade-in duration-300">
        {step === 1 && (
          <div className="space-y-4">
            <Label htmlFor="feelingInArms" className="text-xl md:text-2xl font-semibold leading-relaxed block">
              {t('form.howDidYouFeelInTheArmsOfYourFacilitator')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feelingInArms"
              value={feelingInArms}
              onChange={(e) => setFeelingInArms(e.target.value)}
              rows={4}
              className="text-base md:text-lg focus-visible:ring-primary/50"
              placeholder={t('form.howDidYouFeelInTheArmsOfYourFacilitatorPlaceholder')}
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label htmlFor="overallExperience" className="text-xl md:text-2xl font-semibold leading-relaxed block">
              {t('form.overallExperience')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="overallExperience"
              value={overallExperience}
              onChange={(e) => setOverallExperience(e.target.value)}
              rows={5}
              className="text-base md:text-lg focus-visible:ring-primary/50"
              placeholder={t('form.overallExperiencePlaceholder')}
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Label className="text-xl md:text-2xl font-semibold leading-relaxed block">
              {t('form.didYouFeelSupportedAtTheEndOfYourSession')} <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3">
              {[{ key: 'Yes', value: t('form.yes') }, { key: 'Not enough', value: t('form.notEnough') }, { key: 'Other', value: t('form.other') }].map((option) => (
                <div
                  key={option.key}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${feltSupported === option.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setFeltSupported(option.key)}
                >
                  <input
                    type="radio"
                    name="feltSupported"
                    value={option.key}
                    checked={feltSupported === option.key}
                    onChange={() => setFeltSupported(option.key)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <Label className="ml-3 font-normal cursor-pointer text-lg leading-none w-full">
                    {option.value}
                  </Label>
                </div>
              ))}
            </div>

            {feltSupported === 'Other' && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <Textarea
                  value={feltSupportedDetails}
                  onChange={(e) => setFeltSupportedDetails(e.target.value)}
                  rows={3}
                  className="text-base focus-visible:ring-primary/50"
                  placeholder={t('form.didYouFeelSupportedAtTheEndOfYourSessionPlaceholder')}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Label htmlFor="additionalComments" className="text-xl md:text-2xl font-semibold leading-relaxed block">
              {t('form.additionalComments')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="additionalComments"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              rows={4}
              className="text-base md:text-lg focus-visible:ring-primary/50"
              placeholder={t('form.additionalCommentsPlaceholder')}
              autoFocus
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Label className="text-xl md:text-2xl font-semibold leading-relaxed block">
              {t('form.continueProcess')} <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3">
              {[{ key: 'I would like to receive another session', value: t('form.continueProcessOption1') }, { key: 'No, thank you', value: t('form.continueProcessOption2') }].map((option) => (
                <div
                  key={option.key}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${continueProcess === option.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setContinueProcess(option.key)}
                >
                  <input
                    type="radio"
                    name="continueProcess"
                    value={option.key}
                    checked={continueProcess === option.key}
                    onChange={() => setContinueProcess(option.key)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <Label className="ml-3 font-normal cursor-pointer text-lg w-full">
                    {option.value}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
              <Send className="h-10 w-10 text-primary opacity-80" />
            </div>
            <Label className="text-2xl md:text-3xl font-semibold leading-relaxed block">
              {t('form.almostDone')}
            </Label>
            <p className="text-muted-foreground text-lg mb-8">{t('form.almostDoneDescription')}</p>

            <div
              className={`flex items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all ${interestedInLearning ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/30'}`}
              onClick={() => setInterestedInLearning(!interestedInLearning)}
            >
              <input
                type="checkbox"
                id="interestedInLearning"
                checked={interestedInLearning}
                onChange={() => setInterestedInLearning(!interestedInLearning)}
                className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="interestedInLearning" className="ml-4 text-xl font-medium cursor-pointer select-none">
                {t('form.interestedInLearning')}
              </Label>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-8 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1 || loading}
          className="text-base h-11 px-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> {tCommon('back')}
        </Button>

        {step < totalSteps ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="text-base h-11 px-8"
          >
            {tCommon('next')} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="text-base h-11 px-8"
          >
            {loading ? tCommon('submitting') : tCommon('submit')} <Send className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
