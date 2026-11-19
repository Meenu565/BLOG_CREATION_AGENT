import { callGroq } from './groqService';

/**
 * Generate a single post JSON object using Groq
 * Output: { title, subtitle, subtopics: string[], tags: string[], content: string }
 */
export async function generateZuntraPostAI({ category, userInputs = {}, existingTitles = [], angleIndex = 1, totalAngles = 1 }) {
    const isModeA = Boolean(
        userInputs.title?.trim() ||
        userInputs.subtitle?.trim() ||
        userInputs.content?.trim() ||
        userInputs.subtopics?.length > 0 ||
        userInputs.tags?.length > 0
    );

    const systemPrompt = `You are an expert technical content writer for Zuntra Engineering.
Generate an engaging, professional blog post for the category: "${category}".
Format your entire response as a single, valid JSON object with EXACTLY these keys:
{
  "title": "Engaging, professional title",
  "subtitle": "One concise sentence summarizing the blog post",
  "subtopics": ["3 to 5 relevant technical subtopics"],
  "tags": ["3 to 6 relevant tags"],
  "content": "Full markdown content"
}

Content Guidelines:
- Write content formatted in markdown using ### headings and bullet lists.
- Match the technical depth and clean style of enterprise engineering blogs (e.g. ### Overview, ### Core Tenets, ### Architectural Considerations, ### Summary).
- Do NOT output markdown code fences around the JSON if possible, or ensure it is strictly valid JSON.
- Never include an image or image_url.`;

    let userPrompt = '';
    if (isModeA) {
        userPrompt = `The user has provided some inputs. Treat whatever they typed as instructions and keep it consistent. Never contradict their inputs.
${userInputs.title ? `User Title: "${userInputs.title}"` : ''}
${userInputs.subtitle ? `User Subtitle: "${userInputs.subtitle}"` : ''}
${userInputs.subtopics?.length > 0 ? `User Subtopics: ${userInputs.subtopics.join(', ')}` : ''}
${userInputs.tags?.length > 0 ? `User Tags: ${userInputs.tags.join(', ')}` : ''}
${userInputs.content ? `User Content Notes / Requirements:\n${userInputs.content}` : ''}
${totalAngles > 1 ? `This is variation ${angleIndex} of ${totalAngles}. Provide a unique perspective or distinct angle based on the user's instructions.` : ''}

Generate all the missing fields so the post is complete, high quality, and cohesive.
Return ONLY the JSON object.`;
    } else {
        userPrompt = `Generate a completely unique, compelling blog post for the category: "${category}".
${existingTitles.length > 0 ? `Do NOT repeat or duplicate any of these existing titles:\n- ${existingTitles.slice(0, 20).join('\n- ')}` : ''}
${totalAngles > 1 ? `This is post ${angleIndex} of ${totalAngles}. Ensure it covers a unique angle or technical topic distinct from other posts in this category.` : ''}

Return ONLY the JSON object.`;
    }

    // Call Groq API
    let attempts = 0;
    while (attempts < 2) {
        attempts++;
        try {
            const rawResponse = await callGroq(systemPrompt, userPrompt, 'openai/gpt-oss-120b', 3000);
            
            // Extract JSON object
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in AI response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.title || !parsed.content) {
                throw new Error('Parsed JSON missing title or content');
            }

            return {
                title: userInputs.title?.trim() || parsed.title.trim(),
                subtitle: userInputs.subtitle?.trim() || (parsed.subtitle ? parsed.subtitle.trim() : ''),
                subtopics: userInputs.subtopics?.length > 0 
                    ? userInputs.subtopics 
                    : (Array.isArray(parsed.subtopics) ? parsed.subtopics.map(s => String(s).trim()) : []),
                tags: userInputs.tags?.length > 0 
                    ? userInputs.tags 
                    : (Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).trim()) : []),
                content: userInputs.content?.trim() || parsed.content.trim()
            };
        } catch (err) {
            console.warn(`[Zuntra AI] Attempt ${attempts} failed:`, err);
            if (attempts >= 2) {
                throw new Error(`AI generation failed: ${err.message}`);
            }
        }
    }
}
