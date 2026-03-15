import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Building2, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { setRole } = useAuth();
  const [, setLocation] = useLocation();

  const handleSelectRole = (role: 'SENDER' | 'RECEIVER') => {
    setRole(role);
    setLocation(role === 'SENDER' ? '/' : '/receiver');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-2xl mb-6 shadow-inner">
          <MapPin className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          MeterTrack <span className="text-primary">System</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Secure smart meter tracking from dispatch to delivery. Select your portal to continue.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card 
            className="group cursor-pointer hover-elevate border-2 hover:border-primary/50 transition-all duration-300 h-full bg-card/50 backdrop-blur-sm"
            onClick={() => handleSelectRole('SENDER')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Sender Portal</CardTitle>
              <CardDescription className="text-base">
                Manage dispatch, track trucks, and monitor meter health.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-6">
              <Button className="w-full text-lg h-12 shadow-md" size="lg">
                Enter as Sender
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="group cursor-pointer hover-elevate border-2 hover:border-accent/50 transition-all duration-300 h-full bg-card/50 backdrop-blur-sm"
            onClick={() => handleSelectRole('RECEIVER')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl">Receiver Portal</CardTitle>
              <CardDescription className="text-base">
                Confirm deliveries and verify smart meter batches.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-6">
              <Button variant="outline" className="w-full text-lg h-12 border-2 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-colors" size="lg">
                Enter as Receiver
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
