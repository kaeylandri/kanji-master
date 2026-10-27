// app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Inisialisasi Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Ambil data dari request body
    const { name, email, subject, message } = await request.json();

    // 2. Validasi
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Semua field harus diisi!" },
        { status: 400 }
      );
    }

    // 3. Kirim email
    const { data, error } = await resend.emails.send({
      // 🆕 from: Harus menggunakan domain default Resend saat testing
      from: "Kanji Master Feedback <onboarding@resend.dev>",
      
      // 🆕 to: GANTI KE EMAIL YANG TERDAFTAR DI RESEND (keypengenturu@gmail.com)
      to: ["keypengenturu@gmail.com"],
      
      // 🆕 replyTo: Agar saat kamu klik "Reply", balasan langsung ke user yang mengirim feedback
      replyTo: email,
      
      subject: `[Kanji Master Feedback] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            🎌 Kanji Master - Kritik & Saran
          </h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 8px 0;"><strong>Nama:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 8px 0;"><strong>Subjek:</strong> ${subject}</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            
            <p style="margin: 8px 0;"><strong>Pesan:</strong></p>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 6px; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
            Email ini dikirim otomatis dari halaman feedback Kanji Master.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json(
        { error: "Gagal mengirim email: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem: " + err.message },
      { status: 500 }
    );
  }
}