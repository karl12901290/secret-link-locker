
import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { getUserPlanDetails, getSubscriptionDetails } from "@/services/subscription";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Calendar, Bitcoin, AlertTriangle, Upload } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Json } from "@/integrations/supabase/types";

// Define types for the plan details data structure
type PlanDetails = {
  credits_balance: number;
  plan: string;
  billing_cycle_start: string | null;
  links_created: number;
  plans: {
    name: string;
    price: number;
    links_limit: number;
    max_expiration_days: number | null;
    description: string | null;
    features: Json | null;
  } | null;
}

// Memoize component to prevent unnecessary re-renders
const PlanInfo = memo(() => {
  const { toast } = useToast();
  
  // Use React Query for efficient data fetching with caching
  const { data: planDetails, isLoading: planLoading } = useQuery<PlanDetails>({
    queryKey: ['planDetails'],
    queryFn: getUserPlanDetails,
    staleTime: 60000, // Consider data fresh for 1 minute
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading plan details",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const { data: subscriptionDetails, isLoading: subLoading } = useQuery({
    queryKey: ['subscriptionDetails'],
    queryFn: getSubscriptionDetails,
    staleTime: 60000, // Consider data fresh for 1 minute
    enabled: !!planDetails, // Only fetch subscription after plan details
  });

  const loading = planLoading || subLoading;

  // Initialize storage bucket
  useEffect(() => {
    const setupStorage = async () => {
      try {
        const response = await fetch('/functions/v1/setup-storage', {
          method: 'POST',
        });
        const data = await response.json();
        if (!data.success) {
          console.error('Error setting up storage:', data.error);
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };

    setupStorage();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planDetails) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No plan information available</p>
        </CardContent>
      </Card>
    );
  }

  const plan = planDetails.plans;
  const usedLinksPercent = plan?.links_limit && plan.links_limit > 0 
    ? (planDetails.links_created / plan.links_limit) * 100
    : 0;
  
  // Determine if the user is approaching or has reached their limit
  const isApproachingLimit = plan?.links_limit && plan.links_limit > 0 && 
    planDetails.links_created >= Math.floor(plan.links_limit * 0.8);
  
  const hasReachedLimit = plan?.links_limit && plan.links_limit > 0 && 
    planDetails.links_created >= plan.links_limit;

  const canUploadFiles = plan && plan.price > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Your Current Plan</CardTitle>
            <CardDescription>
              {plan ? plan.description : "No active plan"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-primary">
            {plan ? plan.name : "Explorer"} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plan?.links_limit && plan.links_limit > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Links Usage</span>
                <span>
                  {planDetails.links_created} / {plan.links_limit}
                </span>
              </div>
              <Progress 
                value={usedLinksPercent} 
                className={`h-2 ${hasReachedLimit ? 'bg-red-200' : isApproachingLimit ? 'bg-amber-200' : ''}`} 
              />
              
              {hasReachedLimit && (
                <div className="flex items-center mt-2 p-2 bg-red-50 border border-red-100 rounded-md text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span>You've reached your plan's link limit. <Link to="/pricing" className="text-primary underline">Upgrade your plan</Link> for more links.</span>
                </div>
              )}
              
              {!hasReachedLimit && isApproachingLimit && (
                <div className="flex items-center mt-2 p-2 bg-amber-50 border border-amber-100 rounded-md text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <span>You're approaching your plan's link limit.</span>
                </div>
              )}
            </div>
          )}

          {plan?.links_limit === -1 && (
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-primary mr-2" />
              <span>Unlimited links</span>
            </div>
          )}

          {planDetails.credits_balance > 0 && (
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-primary mr-2" />
              <span>Additional Credits: {planDetails.credits_balance}</span>
            </div>
          )}

          {planDetails.billing_cycle_start && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-primary mr-2" />
              <span>
                Billing cycle: {format(new Date(planDetails.billing_cycle_start), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {subscriptionDetails && (
            <div className="flex items-center">
              <Bitcoin className="h-4 w-4 text-primary mr-2" />
              <span>Payment method: Cryptocurrency</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Upload className="h-4 w-4 mr-2" style={{ color: canUploadFiles ? '#22c55e' : '#9ca3af' }} />
            <span>
              {canUploadFiles 
                ? "File uploads: Enabled" 
                : <>File uploads: <span className="text-gray-400">Unavailable</span> <Link to="/pricing" className="text-primary text-sm ml-2 underline">Upgrade</Link></>}
            </span>
          </div>

          {plan?.price && plan.price > 0 && (
            <div className="mt-4">
              <div className="text-xl font-bold">${plan.price}<span className="text-sm text-gray-600">/month</span></div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/pricing">Change Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

export default PlanInfo;
