
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BarChart, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50">
      {/* Navigation */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-primary">SecretLinkLocker</h2>
          </div>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#features" className={navigationMenuTriggerStyle()}>
                  Features
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#how-it-works" className={navigationMenuTriggerStyle()}>
                  How It Works
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Plans</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                    <div className="p-4">
                      <h3 className="text-xl font-medium mb-1">Our Pricing Plans</h3>
                      <p className="text-sm text-muted-foreground">Choose the perfect plan for your needs</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors">
                        <h4 className="font-medium mb-1">Free Plan</h4>
                        <p className="text-sm text-muted-foreground">Up to 5 secure links</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors">
                        <h4 className="font-medium mb-1">Premium Plans</h4>
                        <p className="text-sm text-muted-foreground">Unlimited secure links</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="mt-3">
                      <RouterLink to="/pricing">View All Plans</RouterLink>
                    </Button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <RouterLink to="/auth">Log In</RouterLink>
            </Button>
            <Button asChild>
              <RouterLink to="/auth">Sign Up</RouterLink>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-16 lg:py-24 gap-12">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold text-primary mb-6 md:text-5xl lg:text-6xl leading-tight">
              Share Files Securely with <span className="text-blue-600">SecretLinkLocker</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Password protection, expiration dates, and detailed analytics for your shared links.
              Take control of your shared content.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="px-8">
                <RouterLink to="/auth">Get Started for Free</RouterLink>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8">
                <RouterLink to="/pricing">View Plans</RouterLink>
              </Button>
            </div>
          </div>
          <div className="relative w-full max-w-md">
            <div className="bg-blue-600/5 backdrop-blur-sm border border-blue-100 rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="h-10 w-3/4 bg-blue-100 rounded-md mb-3"></div>
                  <div className="h-4 w-1/2 bg-gray-100 rounded-md"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-1/2">
                    <div className="h-10 bg-blue-100 rounded-md mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-blue-100"></div>
                </div>
                <div className="h-12 bg-primary rounded-md flex items-center justify-center text-white font-medium">
                  Create Secure Link
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-blue-50 rounded-full border border-blue-100 z-[-1]"></div>
            <div className="absolute -top-6 -left-6 h-16 w-16 bg-blue-50 rounded-full border border-blue-100 z-[-1]"></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-4xl font-bold text-primary">5,000+</p>
            <p className="text-gray-600">Secure Links Created</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-4xl font-bold text-primary">2,500+</p>
            <p className="text-gray-600">Happy Users</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-4xl font-bold text-primary">99.9%</p>
            <p className="text-gray-600">Uptime</p>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to share content securely and track who's accessing it.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-2" />
                <CardTitle>Password Protection</CardTitle>
                <CardDescription>Keep your shared links secure with custom passwords</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Only people with the password can access your shared content, ensuring your files remain private.</p>
              </CardContent>
              <CardFooter>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Custom passwords</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Password strength indicators</span>
                  </li>
                </ul>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mb-2" />
                <CardTitle>Expiration Control</CardTitle>
                <CardDescription>Set custom expiration dates for your links</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Define when your shared links should expire, automatically preventing access after a set time.</p>
              </CardContent>
              <CardFooter>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Custom expiration dates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Auto-expire functionality</span>
                  </li>
                </ul>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <BarChart className="h-12 w-12 text-blue-600 mb-2" />
                <CardTitle>Access Analytics</CardTitle>
                <CardDescription>Track who accessed your links and when</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Get detailed statistics about who viewed your content and when it was accessed.</p>
              </CardContent>
              <CardFooter>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>View counts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Detailed access logs</span>
                  </li>
                </ul>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-16 bg-white rounded-2xl shadow-sm my-20 px-6">
          <h2 className="text-3xl font-bold text-center mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Thousands of users trust SecretLinkLocker to share their content securely.
          </p>
          
          <Carousel className="mx-auto max-w-4xl">
            <CarouselContent>
              <CarouselItem>
                <div className="p-6">
                  <p className="text-lg italic mb-6">
                    "SecretLinkLocker has been a game-changer for our team. We needed a secure way to share 
                    sensitive documents with clients, and this platform delivered everything we needed."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      JD
                    </div>
                    <div>
                      <p className="font-medium">Jane Doe</p>
                      <p className="text-sm text-gray-600">Product Manager at TechCorp</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="p-6">
                  <p className="text-lg italic mb-6">
                    "The analytics feature is incredibly useful. Now I know exactly who has viewed my shared files 
                    and when. The expiration feature gives me peace of mind."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      MS
                    </div>
                    <div>
                      <p className="font-medium">Michael Smith</p>
                      <p className="text-sm text-gray-600">Freelance Designer</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="p-6">
                  <p className="text-lg italic mb-6">
                    "I've tried many similar services, but SecretLinkLocker offers the perfect balance of 
                    security features and ease of use. The free plan is generous enough for my needs."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      AL
                    </div>
                    <div>
                      <p className="font-medium">Amanda Lee</p>
                      <p className="text-sm text-gray-600">Small Business Owner</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="-left-6 md:-left-10" />
            <CarouselNext className="-right-6 md:-right-10" />
          </Carousel>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="py-16 mb-16">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Secure link sharing in three simple steps
          </p>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <div className="bg-blue-100 text-blue-600 h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload your file</h3>
                <p className="text-gray-600">
                  Upload any file or enter the URL you want to share securely with your recipients.
                </p>
              </div>
              <div className="hidden md:block absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={24} />
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <div className="bg-blue-100 text-blue-600 h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Set protection</h3>
                <p className="text-gray-600">
                  Add a password and choose an expiration date to control access to your content.
                </p>
              </div>
              <div className="hidden md:block absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={24} />
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <div className="bg-blue-100 text-blue-600 h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Share the link</h3>
                <p className="text-gray-600">
                  Send the secure link to your intended recipients and track when they access it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing CTA */}
        <div className="py-10 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Plans for Everyone</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From free personal use to professional teams, we have plans to fit your needs.
          </p>
          <Button asChild size="lg" className="px-8">
            <RouterLink to="/pricing">View Pricing Plans</RouterLink>
          </Button>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-10 mb-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to share securely?</h2>
            <p className="text-xl mb-8">
              Create your first secure link in seconds. No credit card required to get started.
            </p>
            <Button asChild size="lg" variant="outline" className="bg-white hover:bg-gray-100 px-8 text-blue-700">
              <RouterLink to="/auth">Get Started Now</RouterLink>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">SecretLinkLocker</h3>
              <p className="text-gray-600 mb-4">
                Secure file sharing with password protection and expiration dates.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-blue-600">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-600 hover:text-blue-600">How it Works</a></li>
                <li><RouterLink to="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</RouterLink></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Get Started</h3>
              <ul className="space-y-2">
                <li><RouterLink to="/auth" className="text-gray-600 hover:text-blue-600">Sign Up</RouterLink></li>
                <li><RouterLink to="/auth" className="text-gray-600 hover:text-blue-600">Log In</RouterLink></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} SecretLinkLocker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
