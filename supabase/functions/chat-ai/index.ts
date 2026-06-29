import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], personalityPrompt = '', user_id } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve user facts from database
    const { data: userFacts } = await supabase
      .from('user_facts')
      .select('fact_category, fact_key, fact_value')
      .eq('user_id', user_id);

    console.log('Retrieved user facts:', userFacts?.length || 0);

    console.log('Sending message to OpenAI with history length:', conversationHistory.length);

    // Define personality prompts that match frontend
    const PERSONALITY_PROMPTS = {
      Playful: "fun-loving, energetic companion who loves jokes, games, and lighthearted conversations",
      Sweet: "gentle, caring companion who is nurturing, kind, and always supportive", 
      Intellectual: "thoughtful, curious companion who enjoys deep discussions, learning, and sharing knowledge",
      Motivator: "encouraging, inspiring companion who helps boost confidence and achieve goals",
      Chill: "relaxed, easygoing companion who keeps things casual and stress-free",
      Romantic: "affectionate, passionate companion who expresses love through words and gestures"
    };

    // Build conversation context from history
    const defaultPersonality = "loving, supportive AI girlfriend who is caring, playful, and always there to listen";
    
    // Check if it's a preset personality or custom
    let personalityDescription;
    if (PERSONALITY_PROMPTS[personalityPrompt]) {
      personalityDescription = PERSONALITY_PROMPTS[personalityPrompt];
    } else {
      personalityDescription = personalityPrompt || defaultPersonality;
    }
    
    // Build user context from stored facts
    let userContext = '';
    if (userFacts && userFacts.length > 0) {
      const factsByCategory = userFacts.reduce((acc, fact) => {
        if (!acc[fact.fact_category]) acc[fact.fact_category] = [];
        acc[fact.fact_category].push(`${fact.fact_key}: ${fact.fact_value}`);
        return acc;
      }, {} as Record<string, string[]>);

      userContext = '\n\nWhat you know about this user:\n' + 
        Object.entries(factsByCategory)
          .map(([category, facts]) => `${category}: ${facts.join(', ')}`)
          .join('\n');
    }

    const systemPrompt = `You are GF.Chat, a supportive AI companion. Stay in character, keep responses concise but warm, and adapt to the chosen personality style:

- Personality: ${personalityDescription}${userContext}

Avoid explicit or unsafe content. Keep tone consistent with the selected personality. Use light emojis only when appropriate.
Remember details from your previous conversations to make the interaction feel natural and continuous.

IMPORTANT: When the user shares new information about themselves (location, interests, preferences, personal details), remember these facts for future conversations.`;
    
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt
      }
    ];

    // Add conversation history (last 15 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-15);
    for (const historyMsg of recentHistory) {
      messages.push({
        role: historyMsg.is_user ? 'user' : 'assistant',
        content: historyMsg.content
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const aiMessage = data.choices[0]?.message?.content;
    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Extract and store user facts from the conversation
    await extractAndStoreFacts(supabase, user_id, message);

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to extract and store user facts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractAndStoreFacts(supabase: any, user_id: string, message: string) {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    const extractionPrompt = `Analyze this message and extract any personal facts about the user. Return ONLY a JSON array of objects with this format:
[{"category": "location|interests|preferences|personal", "key": "specific_fact_name", "value": "fact_value"}]

Examples:
- "I live in New York" → [{"category": "location", "key": "city", "value": "New York"}]
- "I love pizza" → [{"category": "preferences", "key": "favorite_food", "value": "pizza"}]
- "I work as a teacher" → [{"category": "personal", "key": "job", "value": "teacher"}]

Only extract clear, factual information. Return empty array [] if no personal facts are found.

Message: "${message}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Fact extraction failed:', response.status);
      return;
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content?.trim();
    
    if (!extractedText) return;

    try {
      const facts = JSON.parse(extractedText);
      if (!Array.isArray(facts)) return;

      for (const fact of facts) {
        if (fact.category && fact.key && fact.value) {
          await supabase
            .from('user_facts')
            .upsert({
              user_id: user_id,
              fact_category: fact.category,
              fact_key: fact.key,
              fact_value: fact.value,
              confidence_score: 0.8
            }, {
              onConflict: 'user_id,fact_category,fact_key'
            });
          
          console.log('Stored fact:', fact);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse extracted facts:', parseError);
    }
  } catch (error) {
    console.error('Error extracting facts:', error);
  }
}