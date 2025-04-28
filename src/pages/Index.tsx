
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Link, BarChart, Clock } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4 md:text-5xl lg:text-6xl">SecretLinkLocker</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Share files securely with password protection and expiration dates.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <RouterLink to="/auth">Get Started</RouterLink>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <RouterLink to="/pricing">View Plans</RouterLink>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Password Protection</CardTitle>
              <CardDescription>Keep your shared links secure with custom passwords</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Only people with the password can access your shared content, ensuring your files remain private.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Expiration Control</CardTitle>
              <CardDescription>Set custom expiration dates for your links</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Define when your shared links should expire, automatically preventing access after a set time.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Access Analytics</CardTitle>
              <CardDescription>Track who accessed your links and when</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Get detailed statistics about who viewed your content and when it was accessed.</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing CTA */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Plans for Everyone</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From free personal use to professional teams, we have plans to fit your needs.
          </p>
          <Button asChild size="lg">
            <RouterLink to="/pricing">View Pricing</RouterLink>
          </Button>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2">1. Upload your file</h3>
              <p className="text-gray-600 mb-4">Upload any file you want to share securely.</p>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-xl font-semibold mb-2">2. Set protection</h3>
              <p className="text-gray-600 mb-4">Add a password and choose an expiration date.</p>
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-xl font-semibold mb-2">3. Share the link</h3>
              <p className="text-gray-600 mb-4">Send the secure link to your intended recipients.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to share securely?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
            Create your first secure link in seconds. No credit card required for basic use.
          </p>
          <Button asChild size="lg">
            <RouterLink to="/auth">Get Started Now</RouterLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
