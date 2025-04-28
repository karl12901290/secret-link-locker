
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Plan = Tables<"plans">;

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch plans and user auth status
  useEffect(() => {
    const fetchPlansAndAuthStatus = async () => {
      try {
        // Get plans from the database
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select("*")
          .order("price", { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Check auth status
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);

        // If authenticated, get current plan
        if (data.session) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("plan, plan_id")
            .eq("id", data.session.user.id)
            .single();

          if (profileData) {
            setCurrentPlan(profileData.plan || "free");
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error loading plans",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchPlansAndAuthStatus();
  }, [toast]);

  const handleSelectPlan = async (planName: string, planId: string) => {
    if (!isAuthenticated) {
      // Store the selected plan in session storage and redirect to auth
      sessionStorage.setItem("selectedPlan", planId);
      navigate("/auth");
      return;
    }
    
    setLoading(true);
    
    try {
      // For now, we'll just redirect to a Stripe checkout function
      // In a future step we'll implement the actual payment process
      await initiateCheckout(planId);
    } catch (error: any) {
      toast({
        title: "Error selecting plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateCheckout = async (planId: string) => {
    // We'll implement this with Stripe in the next step
    // For now, just show a message
    toast({
      title: "Coming Soon",
      description: "Payment processing will be implemented in the next step.",
    });
  };

  const renderFeatures = (featuresArray: any[]) => {
    return (
      <ul className="space-y-2">
        {featuresArray.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Select the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`flex flex-col ${
                plan.name === "Power" 
                  ? "border-primary ring-2 ring-primary ring-opacity-50" 
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.name === "Power" && (
                    <Badge variant="secondary" className="ml-2">
                      Popular
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-sm text-gray-600">/month</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-primary mr-2" />
                    <span>
                      {plan.links_limit === -1
                        ? "Unlimited links"
                        : `${plan.links_limit} links`}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-primary mr-2" />
                    <span>
                      {plan.max_expiration_days === 1
                        ? "24 hour expiry"
                        : `${plan.max_expiration_days} day max expiry`}
                    </span>
                  </div>
                  
                  {renderFeatures(plan.features as string[] || [])}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSelectPlan(plan.name, plan.id)}
                  disabled={loading || currentPlan === plan.name}
                  className="w-full"
                  variant={plan.name === "Power" ? "default" : "outline"}
                >
                  {currentPlan === plan.name
                    ? "Current Plan"
                    : loading
                    ? "Processing..."
                    : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More?</h2>
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-medium">Top-Up Credits</span>
            </div>
            <p className="mb-4 text-gray-600">
              Need more links but don't want to upgrade? Buy additional credits anytime.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="flex flex-col" disabled>
                <span className="text-lg font-bold">$1</span>
                <span className="text-xs">20 links</span>
              </Button>
              <Button variant="outline" className="flex flex-col" disabled>
                <span className="text-lg font-bold">$3</span>
                <span className="text-xs">70 links</span>
              </Button>
              <Button variant="outline" className="flex flex-col" disabled>
                <span className="text-lg font-bold">$5</span>
                <span className="text-xs">120 links</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
