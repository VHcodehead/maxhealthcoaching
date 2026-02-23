'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, ArrowLeft, Scale, Ruler, Star, Footprints, Moon, FileText, CalendarCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { checkInSchema } from '@/lib/validations';
import { isWithinCheckInWindow, getNextWindowOpens, hasCheckedInThisWeek } from '@/lib/checkin-schedule';
import { toast } from 'sonner';
import type { z } from 'zod';

type CheckInData = z.infer<typeof checkInSchema>;

function formatCountdown(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'now';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h`;
  return `${hours}h`;
}

type PageState = 'loading' | 'window-closed' | 'already-done' | 'form' | 'photos' | 'done';

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<PageState>('loading');
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState(false);
  const [oldCalories, setOldCalories] = useState(0);
  const [newCalories, setNewCalories] = useState(0);
  const [photos, setPhotos] = useState<Record<string, File | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});

  // Check window status and existing check-ins on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/checkin');
        if (!res.ok) {
          setStep('form');
          return;
        }
        const data = await res.json();
        const checkIns = data.checkIns || [];
        const isFirstCheckIn = checkIns.length === 0;

        // First-ever check-in bypasses window check
        if (isFirstCheckIn) {
          setStep('form');
          return;
        }

        // Check if already checked in this week
        const lastCheckInDate = checkIns[0]?.createdAt;
        if (hasCheckedInThisWeek(lastCheckInDate)) {
          setStep('already-done');
          return;
        }

        // Check if within window
        if (!isWithinCheckInWindow()) {
          setStep('window-closed');
          return;
        }

        setStep('form');
      } catch {
        // On error, show the form and let the server handle validation
        setStep('form');
      }
    }
    checkStatus();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckInData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      adherence_rating: 7,
      steps_avg: 8000,
      sleep_avg: 7,
      notes: '',
    },
  });

  const adherenceRating = watch('adherence_rating');

  const onSubmitForm = async (data: CheckInData) => {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setStep('window-closed');
          return;
        }
        if (res.status === 409) {
          setStep('already-done');
          return;
        }
        throw new Error(result.error || 'Failed to submit check-in');
      }

      setCheckInId(result.checkIn.id);
      if (result.pendingAdjustment) {
        setPendingAdjustment(true);
        setOldCalories(result.oldCalories);
        setNewCalories(result.newCalories);
      }
      setStep('photos');
      toast.success('Check-in data saved!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const handlePhotoSelect = (type: string, file: File) => {
    setPhotos((prev) => ({ ...prev, [type]: file }));
    const url = URL.createObjectURL(file);
    setPhotoPreviews((prev) => ({ ...prev, [type]: url }));
  };

  const uploadPhotos = async () => {
    if (!checkInId) return;
    setUploading(true);

    try {
      for (const [type, file] of Object.entries(photos)) {
        if (!file) continue;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('check_in_id', checkInId);
        formData.append('photo_type', type);

        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to upload ${type} photo`);
        }
      }

      setStep('done');
      toast.success('Photos uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Window closed state
  if (step === 'window-closed') {
    const nextOpens = getNextWindowOpens();
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check-In Window Closed</h2>
          <p className="text-zinc-500 mb-6">
            Check-ins are accepted from Saturday evening through Tuesday. The next window opens in <span className="font-semibold text-zinc-700">{formatCountdown(nextOpens)}</span>.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // Already checked in this week
  if (step === 'already-done') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Already Checked In</h2>
          <p className="text-zinc-500 mb-6">
            You&apos;ve already submitted your check-in this week. See you next Sunday!
          </p>
          <Button onClick={() => router.push('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check-In Complete!</h2>

          {pendingAdjustment ? (
            <>
              <p className="text-zinc-500 mb-4">
                Your weight change has been logged. Your coach will review your nutrition targets before any changes are applied.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-900 mb-1">Macro Adjustment Pending Review</p>
                <p className="text-sm text-amber-700">
                  Suggested change: {oldCalories} → {newCalories} kcal
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Your coach will review this and update your targets when ready.
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Back to Dashboard
              </Button>
            </>
          ) : (
            <>
              <p className="text-zinc-500 mb-6">
                Great job staying consistent. Your coach will review your check-in shortly.
              </p>
              <Button onClick={() => router.push('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
                Back to Dashboard
              </Button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold">Weekly Check-In</h1>
            <p className="text-xs text-zinc-500">
              {step === 'form' ? 'Step 1: Metrics & Notes' : 'Step 2: Progress Photos'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 'form' ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmitForm)}
            className="space-y-6"
          >
            {/* Weight */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" /> Body Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    {...register('weight_kg', { valueAsNumber: true })}
                    placeholder="75.0"
                  />
                  {errors.weight_kg && (
                    <p className="text-xs text-red-500 mt-1">{errors.weight_kg.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Waist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-emerald-600" /> Waist Measurement
                  <span className="text-xs font-normal text-zinc-400">(Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="waist_cm">Waist (cm)</Label>
                  <Input
                    id="waist_cm"
                    type="number"
                    step="0.1"
                    {...register('waist_cm', { valueAsNumber: true })}
                    placeholder="80.0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Adherence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-600" /> Plan Adherence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>How well did you follow your plan?</Label>
                    <span className="text-sm font-semibold text-emerald-600">{adherenceRating}/10</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[adherenceRating]}
                    onValueChange={([val]) => setValue('adherence_rating', val)}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>Barely followed</span>
                    <span>Perfect adherence</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Steps & Sleep */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-emerald-600" /> Activity & Recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="steps_avg">Average daily steps</Label>
                  <Input
                    id="steps_avg"
                    type="number"
                    {...register('steps_avg', { valueAsNumber: true })}
                    placeholder="8000"
                  />
                </div>
                <div>
                  <Label htmlFor="sleep_avg" className="flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Average sleep (hours)
                  </Label>
                  <Input
                    id="sleep_avg"
                    type="number"
                    step="0.5"
                    {...register('sleep_avg', { valueAsNumber: true })}
                    placeholder="7"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="How was your week? Any challenges, wins, or things to note..."
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Continue to Photos →'}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Camera className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Progress Photos</h2>
              <p className="text-sm text-zinc-500">
                Take photos in consistent lighting and pose. These are private — only you and your coach can see them.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(['front', 'side', 'back'] as const).map((type) => (
                <div key={type} className="text-center">
                  <label
                    className={`block aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                      photoPreviews[type]
                        ? 'border-emerald-500'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {photoPreviews[type] ? (
                      <img
                        src={photoPreviews[type]}
                        alt={`${type} photo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoSelect(type, file);
                      }}
                    />
                  </label>
                  <p className="text-xs font-medium mt-2 capitalize">{type}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('done');
                }}
              >
                Skip Photos
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={uploadPhotos}
                disabled={uploading || !Object.values(photos).some(Boolean)}
              >
                {uploading ? 'Uploading...' : 'Upload & Finish'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
