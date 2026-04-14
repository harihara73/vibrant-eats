"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle } from "lucide-react";

interface OrderSimulatorProps {
  orderId: string;
  onStatusUpdate: () => void;
}

export default function OrderSimulator({ orderId, onStatusUpdate }: OrderSimulatorProps) {
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  const updateStatus = async (status: string) => {
    setCurrentStep(status);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onStatusUpdate();
    } catch (err) {
      console.error("Simulation status update failed:", err);
    }
  };

  const startSimulation = async () => {
    setSimulating(true);
    
    // Step 1: Accept immediately
    await updateStatus("accepted");
    
    // Step 2: Prepare after 15s
    await new Promise(r => setTimeout(r, 15000));
    await updateStatus("preparing");
    
    // Step 3: Out for delivery after another 15s
    await new Promise(r => setTimeout(r, 15000));
    await updateStatus("out-for-delivery");
    
    // Step 4: Deliver after another 30s (Total ~1min)
    await new Promise(r => setTimeout(r, 30000));
    await updateStatus("delivered");
    
    setSimulating(false);
    setCurrentStep("completed");
  };

  if (simulating) {
    return (
      <div className="simulator-active">
        <Loader2 className="animate-spin" size={14} />
        <span>Simulating: {currentStep}...</span>
        <style jsx>{`
          .simulator-active {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--primary);
            background: #fff1f2;
            padding: 0.25rem 0.5rem;
            border-radius: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  if (currentStep === "completed") {
    return (
      <div className="simulator-done">
        <CheckCircle size={14} />
        <span>Sim Done</span>
        <style jsx>{`
          .simulator-done {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            font-weight: 700;
            color: #10b981;
          }
        `}</style>
      </div>
    );
  }

  return (
    <button className="sim-btn" onClick={startSimulation} title="Run 1-minute full simulation">
      <Play size={14} />
      <span>Simulate</span>
      <style jsx>{`
        .sim-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #f1f5f9;
          border: 1px solid var(--border);
          padding: 0.25rem 0.6rem;
          border-radius: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .sim-btn:hover {
          background: #e2e8f0;
          color: var(--primary);
          border-color: var(--primary);
        }
      `}</style>
    </button>
  );
}
