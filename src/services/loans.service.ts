import db from "../database/db.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class LoanService {
  async uploadLoanDocument(body: any, userId: number) {
    const analysis = await this.analyzeLoanApplication(body.amount, body.installments, body.fileMetadata);
    console.log('analysy', analysis);

    return await db('loan_documents').insert({
      user_id: userId,
      ...body,
      status: analysis.suggestion.toLowerCase(),
      review_suggestion: analysis.suggestion,
      risk_score: analysis.riskScore,
      reason: analysis.reasoning
    });
  };

  async analyzeLoanApplication(loanAmount: string, installments: number, file: any) {
    const genAI = new GoogleGenerativeAI("AIzaSyDk8ssXkyGNtEEGy-LZZtCmNQioL075Kh4");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const monthlyRepayment = (parseFloat(loanAmount) * 1.05) / installments;

    const prompt = `
  You are an expert Credit Analyst. Analyze the following loan application data and document text.
  
    **Loan Details:**
    - Requested Amount: ₦${parseFloat(loanAmount).toLocaleString()}
    - Duration: ${installments} months
    - Interest Rate: 5% (Amortized)
    - Monthly Repayment Amount: ₦${monthlyRepayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    
    **Analysis Requirements:**
    1. Evaluate the risk based on the provided document text and applicant profile.
    2. Determine if the requested amount of ₦${loanAmount} and the monthly repayment are sustainable for the applicant based on their bank statement.
    3. Suggest a clear action: "APPROVE" or "REJECT".
    4. Provide a detailed justification ("reasoning") for the decision.
    5. Ensure all currency references in your reasoning are in Naira (₦).

    **Output Format:**
    Return ONLY a JSON object with the following structure:
    {
      "suggestion": "APPROVED" | "REJECTED",
      "amountEvaluated": ${loanAmount},
      "monthlyObligation": ${monthlyRepayment.toFixed(2)},
      "reasoning": "A concise explanation of the credit decision.",
      "riskScore": "A number from 1 to 100. should never be a decimal"
    }
  `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
        },
      },
    ]);

    return JSON.parse(result.response.text());
  };

};

export const loanService = new LoanService();