"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Image as ImageIcon, 
  ShieldCheck,
  UtensilsCrossed 
} from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  discount: number;
  preparationTime: number;
  dietaryType: "Veg" | "Non-Veg";
}

const CATEGORIES = [
  "Soups and Salads",
  "Appetizers / Starters",
  "Main Course / Entrées",
  "Sides / Accompaniments",
  "Desserts",
  "Beverages"
];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    discount: "0",
    preparationTime: "10",
    dietaryType: "Veg",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        setError("Failed to load menu items.");
        setItems([]);
      }
    } catch (err) {
      setError("Network error: Could not reach the server.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const method = editingItem ? "PATCH" : "POST";
    const url = editingItem ? `/api/menu/${editingItem._id}` : "/api/menu";

    try {
      const parsedPrice = parseFloat(formData.price) || 0;
      const parsedDiscount = parseFloat(formData.discount) || 0;
      const parsedPrepTime = parseInt(formData.preparationTime) || 10;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parsedPrice,
          discount: parsedDiscount,
          preparationTime: parsedPrepTime,
          dietaryType: formData.dietaryType,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData({ name: "", description: "", price: "", category: CATEGORIES[0], image: "", discount: "0", preparationTime: "10", dietaryType: "Veg" });
        await fetchItems();
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic Update: Remove from local state immediately
    const originalItems = [...items];
    const itemToDelete = items.find(item => item._id === id);
    setItems(items.filter(item => item._id !== id));
    setDeletingId(null);

    try {
      const res = await fetch(`/api/menu/${id.toString()}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        // Rollback state on failure
        setItems(originalItems);
        alert(`Failed to delete ${itemToDelete?.name}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      // Rollback state on error
      setItems(originalItems);
      alert("Network error: Could not complete deletion.");
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !current }),
      });
      if (res.ok) {
        await fetchItems();
      } else {
        const errorData = await res.json();
        alert(`Failed to update status: ${errorData.error || 'Unauthorized'}`);
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      alert("Network error: Could not update status.");
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">
          <AdminMobileHeader />
          <div className="loader-overlay" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p>Loading your menu...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="main-content">
        <AdminMobileHeader />

        <div className="dashboard-header">
          <div>
            <h1>Menu Management</h1>
            <p>Add, edit or remove dishes from your restaurant.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingItem(null);
              setFormData({ name: "", description: "", price: "", category: CATEGORIES[0], image: "", discount: "0", preparationTime: "10", dietaryType: "Veg" });
              setShowModal(true);
            }}
          >
            <Plus size={20} />
            <span>Add New Dish</span>
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ShieldCheck size={24} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Connection Notice</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
              </div>
            </div>
            <button onClick={fetchItems} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              Refresh
            </button>
          </div>
        )}

        <div className="admin-menu-list">
          {CATEGORIES.map((category) => {
            const categoryItems = items
              .filter(item => item.category === category)
              .sort((a, b) => a.name.localeCompare(b.name));

            if (categoryItems.length === 0) return null;

            return (
              <section key={category} className="admin-category-section" style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{category}</h2>
                  <div style={{ height: '2px', flex: 1, background: 'linear-gradient(to right, var(--border), transparent)', borderRadius: '2px' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--admin-bg)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    {categoryItems.length} {categoryItems.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="admin-grid">
                  {categoryItems.map((item) => (
                    <div key={item._id} className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '180px', 
                          width: '100%', 
                          background: item.image ? `url(${item.image}) center/cover` : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          position: 'relative'
                        }}
                      >
                        {!item.image && <ImageIcon size={40} />}
                        {item.discount > 0 && (
                          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--success)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                            {item.discount}% OFF
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: item.dietaryType === 'Veg' ? '#22c55e' : '#ef4444', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, border: '2px solid white' }}>
                          {item.dietaryType}
                        </div>
                        {deletingId === item._id && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, padding: '1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                              <Trash2 size={32} color="#ef4444" />
                            </div>
                            <p style={{ margin: '0 0 1.25rem 0', fontWeight: 800, fontSize: '1rem', lineHeight: 1.4 }}>Permanently delete this dish?</p>
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                              <button 
                                type="button"
                                onClick={() => handleDelete(item._id)}
                                className="btn-primary" 
                                style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', fontSize: '0.875rem', padding: '0.625rem', fontWeight: 700 }}
                              >
                                Delete
                              </button>
                              <button 
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="btn-secondary" 
                                style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 700 }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {!item.isAvailable && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.875rem', backdropFilter: 'blur(2px)' }}>
                            OUT OF STOCK
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{item.name}</h3>
                          <div style={{ color: 'var(--primary)', fontWeight: 900 }}>₹{item.price}</div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button 
                            type="button"
                            className="btn-secondary" 
                            style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem' }}
                            onClick={() => {
                              setEditingItem(item);
                              setFormData({
                                name: item.name,
                                description: item.description || "",
                                price: (item.price ?? 0).toString(),
                                category: item.category || CATEGORIES[0],
                                image: item.image || "",
                                discount: (item.discount ?? 0).toString(),
                                preparationTime: (item.preparationTime ?? 10).toString(),
                                dietaryType: item.dietaryType || "Veg",
                              });
                              setShowModal(true);
                            }}
                          >
                            <Edit2 size={14} style={{ marginRight: '0.5rem' }} />
                            Edit
                          </button>
                          <button 
                            type="button"
                            className="btn-secondary" 
                            style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', background: item.isAvailable ? '#f0fdf4' : '#fff1f2', color: item.isAvailable ? '#166534' : '#991b1b', borderColor: item.isAvailable ? '#bbf7d0' : '#fecaca' }}
                            onClick={() => toggleAvailability(item._id, item.isAvailable)}
                          >
                            {item.isAvailable ? "In Stock" : "Out of Stock"}
                          </button>
                          <button 
                            type="button"
                            className="btn-secondary" 
                            style={{ padding: '0.625rem', color: 'var(--danger)', borderColor: '#fecaca' }}
                            onClick={() => setDeletingId(item._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          
          {items.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.25rem', border: '2px dashed var(--border)' }}>
              <UtensilsCrossed size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h2 style={{ color: 'var(--text-muted)' }}>No items found</h2>
              <p>Start adding dishes to your menu</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="sidebar-overlay show" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setShowModal(false)}>
            <div 
              className="stat-card" 
              style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 900 }}>
                {editingItem ? "Edit Dish" : "Add New Dish"}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Dish Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prep Time (mins)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      required
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Dietary Type</label>
                    <select
                      required
                      className="form-input"
                      value={formData.dietaryType}
                      onChange={(e) => setFormData({ ...formData, dietaryType: e.target.value as "Veg" | "Non-Veg" })}
                    >
                      <option value="Veg">Veg (Green)</option>
                      <option value="Non-Veg">Non-Veg (Red)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? "Saving..." : "Save Dish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
