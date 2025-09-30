import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createMatchSchema, CreateMatchFormData } from '@/lib/schemas/createMatch';
import { CourseStep } from '@/components/wizard/CourseStep';
import { TeeTimeStep } from '@/components/wizard/TeeTimeStep';
import { FormatStep } from '@/components/wizard/FormatStep';
import { StakesStep } from '@/components/wizard/StakesStep';
import { ReviewStep } from '@/components/wizard/ReviewStep';
import { createMatch } from '@/lib/api/matches.client';
import { fetchCurrentUser } from '@/lib/api/users.client';
import { dollarsToCents } from '@/lib/money';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, name: 'Course & Tee', description: 'Select course and tee set' },
  { id: 2, name: 'Tee Time', description: 'Choose date and time' },
  { id: 3, name: 'Format', description: 'Select game format' },
  { id: 4, name: 'Stakes', description: 'Set match stakes' },
  { id: 5, name: 'Review', description: 'Confirm details' },
];

export function CreateMatchPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateMatchFormData>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      courseId: '',
      teeId: '',
      teeTimeDate: '',
      teeTimeHour: '',
      teeTimeMinute: '',
      teeTimePeriod: 'AM',
      format: 'match_play_net',
      skins: false,
      nassau: false,
      maxPlayers: 2,
      stakesDollars: 50,
    },
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CreateMatchFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['courseId', 'teeId'];
        break;
      case 2:
        fieldsToValidate = ['teeTimeDate', 'teeTimeHour', 'teeTimeMinute', 'teeTimePeriod'];
        break;
      case 3:
        fieldsToValidate = ['format', 'maxPlayers'];
        break;
      case 4:
        fieldsToValidate = ['stakesDollars'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CreateMatchFormData) => {
    setIsSubmitting(true);
    try {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        throw new Error('You must be logged in to create a match');
      }

      // Convert time to ISO string
      const date = new Date(data.teeTimeDate);
      let hour = parseInt(data.teeTimeHour);
      if (data.teeTimePeriod === 'PM' && hour !== 12) {
        hour += 12;
      } else if (data.teeTimePeriod === 'AM' && hour === 12) {
        hour = 0;
      }
      date.setHours(hour, parseInt(data.teeTimeMinute), 0, 0);

      const match = await createMatch({
        courseId: data.courseId,
        teeId: data.teeId,
        creatorId: currentUser.id,
        teeTimeISO: date.toISOString(),
        format: data.format,
        options: {
          skins: data.skins,
          nassau: data.nassau,
        },
        stakesCents: dollarsToCents(data.stakesDollars),
        status: 'open',
        playerIds: [currentUser.id],
        maxPlayers: data.maxPlayers,
      });

      toast({
        title: 'Match Created!',
        description: 'Your match has been created successfully.',
      });

      navigate(`/match/${match.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create match',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CourseStep form={form} />;
      case 2:
        return <TeeTimeStep form={form} />;
      case 3:
        return <FormatStep form={form} />;
      case 4:
        return <StakesStep form={form} />;
      case 5:
        return <ReviewStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discover
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create a Match</h1>
        <p className="text-muted-foreground">
          Set up a new money match and invite players to join
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    currentStep > step.id
                      ? 'border-green-600 bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'border-green-600 bg-background text-green-600'
                      : 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 hidden md:block text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-12 md:w-24 transition-colors',
                    currentStep > step.id ? 'bg-green-600' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Match'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}