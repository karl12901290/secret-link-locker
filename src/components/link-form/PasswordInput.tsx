
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  password: string;
  setPassword: (password: string) => void;
}

const PasswordInput = ({ password, setPassword }: PasswordInputProps) => {
  return (
    <div>
      <Label htmlFor="password">Password (optional)</Label>
      <Input
        type="password"
        id="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1"
      />
    </div>
  );
};

export default PasswordInput;
