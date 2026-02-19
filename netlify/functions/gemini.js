exports.handler = async function(event, context) {
  // 1. รับข้อมูลที่ส่งมาจากหน้าเว็บ
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { prompt } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    console.error("Error: ไม่พบ API Key ใน Netlify Environment Variables");
    return { statusCode: 500, body: JSON.stringify({ error: "ระบบตรวจไม่พบ API Key" }) };
  }

  try {
    // 2. ใช้รุ่น Stable: gemini-3-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    // 3. เช็คว่าฝั่ง Google แจ้ง Error อะไรกลับมาไหม
    if (!response.ok) {
      console.error("Google API Error:", data.error); // พิมพ์ Error ลงใน Log ของ Netlify
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "เกิดข้อผิดพลาดจาก API" })
      };
    }

    // 4. ส่งข้อมูลกลับไปยังหน้าเว็บ
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error("Fetch Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "นุ๊กขออภัยค่ะ ระบบประมวลผลขัดข้อง: " + error.message })
    };
  }
};