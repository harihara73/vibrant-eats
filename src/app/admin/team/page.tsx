"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Key, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Search,
  User as UserIcon,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch (err) {
      console.error("Failed to fetch team");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    
    const isEditing = !!editingMember;
    const url = isEditing ? `/api/admin/team/${editingMember._id}` : "/api/admin/team";
    const method = isEditing ? "PATCH" : "POST";

    // Handle automated domain
    let finalEmail = formData.email;
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.trim()}@eatsdelivery.com`;
    }

    const payload: any = { ...formData, email: finalEmail };
    if (isEditing && !formData.password) delete payload.password;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isEditing) {
          setMembers(members.map(m => m._id === data._id ? data : m));
        } else {
          setMembers([data, ...members]);
        }
        closeModal();
      } else {
        setError(data.error || "Action failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ name: "", email: "", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ name: member.name, email: member.email, password: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: "", email: "", password: "" });
    setError("");
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this delivery boy? they will no longer be able to log in.")) return;
    
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers(members.filter(m => m._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete member");
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="main-content">
        <AdminMobileHeader />
        
        <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1>Manage Delivery Crew</h1>
            <p>Add, monitor, or remove your delivery partners.</p>
          </div>
          <button className="btn-primary" onClick={openAddModal}>
            <UserPlus size={18} /> Add New Member
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
           <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
           <input 
              type="text" 
              placeholder="Search by name or email..." 
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '1rem', border: '1px solid var(--border)', fontSize: '1rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          <AnimatePresence>
            {filteredMembers.map((member) => (
              <motion.div 
                key={member._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="stat-card"
                style={{ position: 'relative' }}
              >
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => openEditModal(member)}
                    style={{ background: '#f0f9ff', color: '#0ea5e9', border: 'none', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteMember(member._id)}
                    style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ width: 56, height: 56, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserIcon size={24} />
                   </div>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{member.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                      <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600 }}>{member.email}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#16a34a', fontSize: '0.8rem', fontWeight: 800, padding: '0.75rem' }}>
                      <CheckCircle2 size={16} />
                      ACTIVE DELIVERY ROLE
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
             </div>
          )}

          {!loading && filteredMembers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
               <Users size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
               <h3 style={{ color: 'var(--text-muted)' }}>No team members found</h3>
               <p>Your delivery crew will appear here once you add them.</p>
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {isModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal-content"
              style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '450px', position: 'relative' }}
            >
              <button 
                onClick={closeModal} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {editingMember ? `Update ${editingMember.name}'s account details.` : "Create an account for a new delivery boy."}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Sharma"
                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '1rem' }}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Email Account</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. rahul"
                      style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', fontSize: '1rem', outline: 'none' }}
                      value={formData.email.split('@')[0]}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                    <div style={{ padding: '0 1rem', background: '#f1f5f9', height: '100%', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, borderLeft: '1px solid var(--border)' }}>
                      @eatsdelivery.com
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {editingMember ? "New Password (Leave blank to keep current)" : "Login Password"}
                  </label>
                  <input 
                    type="password" 
                    required={!editingMember}
                    placeholder={editingMember ? "•••••••• (optional)" : "••••••••"}
                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '1rem' }}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={formLoading}
                  style={{ width: '100%', padding: '1.25rem', marginTop: '1rem' }}
                >
                  {formLoading ? <Loader2 className="animate-spin" size={20} /> : (editingMember ? "Update Member" : "Create Account")}
                </button>
              </form>
            </motion.div>
          </div>
        )}

      </main>
    </div>
  );
}
