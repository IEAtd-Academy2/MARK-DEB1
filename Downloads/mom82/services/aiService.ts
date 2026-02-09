
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

class AIServiceManager {
  private static instance: AIServiceManager;

  private constructor() {}

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * تحليل بيانات الموظفين باستخدام Gemini API.
   * يتم إنشاء مثيل جديد من SDK عند كل طلب لضمان استخدام أحدث مفتاح API من البيئة.
   */
  public async analyzeWorkforce(
    employeesData: any[],
    timeRangeLabel: string
  ): Promise<AIAnalysisResult[]> {
    
    // التحقق من وجود مفتاح API في بيئة العمل
    if (process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
          بصفتك خبير في تحليل الموارد البشرية، قم بتحليل بيانات الموظفين التالية للفترة: ${timeRangeLabel}.
          يجب أن تكون الإجابة عبارة عن مصفوفة JSON فقط.
          التصنيفات المسموحة: 'Leader Material', 'Needs Improvement', 'Plan C (Risk)', 'Steady Performer'.
          
          البيانات: ${JSON.stringify(employeesData)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // استخدام أقوى نموذج للتحليل المعقد
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    employeeName: { type: Type.STRING },
                    classification: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedCourses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    managerNotes: { type: Type.STRING }
                  },
                  required: ['employeeName', 'classification', 'strengths', 'weaknesses', 'suggestedCourses', 'managerNotes']
                }
              }
            }
          });

          if (response.text) {
            return JSON.parse(response.text) as AIAnalysisResult[];
          }
          throw new Error("Empty response from AI model");
      } catch (error) {
        console.warn("فشل الاتصال بـ Gemini، يتم الانتقال لوضع المحاكاة المحلي:", error);
        return this.generateMockAnalysis(employeesData);
      }
    }

    // وضع المحاكاة المجاني في حال عدم توفر مفتاح API
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(this.generateMockAnalysis(employeesData));
        }, 1200);
    });
  }

  private generateMockAnalysis(data: any[]): AIAnalysisResult[] {
    return data.map(emp => {
        const score = parseFloat(emp.current_kpi_score || "0");
        const onTime = parseFloat(emp.task_completion_rate || "0");
        const mood = parseFloat(emp.average_mood_score || "5");
        
        let classification: any = 'Steady Performer';
        let strengths: string[] = [];
        let weaknesses: string[] = [];
        let courses: string[] = [];
        let notes = "";

        if (score >= 90 && mood >= 7) {
            classification = 'Leader Material';
            strengths = ['أداء استثنائي', 'روح قيادية', 'ثبات انفعالي'];
            courses = ['القيادة الاستراتيجية', 'إدارة فرق العمل المتقدمة'];
            notes = "هذا الموظف جوهرة يجب الحفاظ عليها. فكر في ترقيته أو تسليمه مسؤوليات أكبر.";
        } else if (score < 60 || mood < 4) {
            classification = 'Plan C (Risk)';
            weaknesses = ['انخفاض الإنتاجية', 'مؤشرات انسحاب', 'جودة عمل منخفضة'];
            courses = ['إدارة الوقت والأولويات', 'أساسيات الالتزام المهني'];
            notes = "هناك خطر حقيقي. يجب الجلوس معه فوراً لفهم الأسباب أو البدء في البحث عن بديل (Plan C).";
        } else if (score < 80) {
            classification = 'Needs Improvement';
            strengths = ['يحاول بجد', 'ملتزم بالحضور'];
            weaknesses = ['يحتاج توجيه فني', 'بطء في التنفيذ'];
            courses = ['تحسين الكفاءة التشغيلية', 'مهارات التواصل الفعال'];
            notes = "لديه القابلية للتطور ولكن يحتاج إلى خطة تحسين ومتابعة دقيقة.";
        } else {
            classification = 'Steady Performer';
            strengths = ['منجز للمهام', 'مستقر', 'يعتمد عليه'];
            courses = ['تنمية المهارات الإبداعية', 'الذكاء العاطفي'];
            notes = "موظف مستقر وجيد. شجعه للحفاظ على هذا المستوى.";
        }

        return {
            employeeName: emp.name,
            classification,
            strengths,
            weaknesses: weaknesses.length ? weaknesses : ['لا توجد نقاط ضعف حرجة'],
            suggestedCourses: courses,
            managerNotes: notes
        };
    });
  }
}

export const AiService = AIServiceManager.getInstance();
