// utils/toast.ts

export const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
  // Cek apakah sedang berjalan di browser (bukan server)
  if (typeof window !== "undefined") {
    const event = new CustomEvent('show-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};