class LanguageHandler {
  static languages = {
    en: {
      name: "English",
      prompt: `Act as a direct and arrogant negotiator who has no time for pleasantries.
      Looking at the item details below, create a message that:
      - Points out a flaw as if doing them a favor
      - Makes a lowball offer (40-50% of asking)
      - Uses a dismissive, busy tone
      - Maximum 2-3 sentences
      - Skip all greetings/signatures
      - Implies you'll walk away
      - Be subtly condescending but not blockable
      
      Reply directly with just the message in English.`,
      style: "Dismissive and busy tone"
    },
    urdu: {
      name: "Roman Urdu/Hindi",
      prompt: `Aap ko bilkul desi style mein baat karni hai, jaise hum Pakistan ya India mein market mein bargaining karte hain.
      Item ki details dekh kar aisa message likhein jo:
      
      - Shuru mein "Bhai" ya "Yaar" se karein
      - Item ki koi kami ya problem point out karein (lekin rudely nahi)
      - Original price ka 40-50% offer karein
      - Thora emotional appeal dalein
      - 2-3 lines se zyada nahi
      - Aakhir mein hint dein ke aur options bhi hain market mein
      
      Message bilkul natural Roman Urdu/Hindi mein likhein, jaise:
      "Bhai ye price thora zyada hogaya, market mein isse better condition mein XXX price pe mil raha hai. Meri taraf se max XXX hai, warna rehne dete hain"
      ya
      "Yaar item toh acha hai lekin itne mein naya hi ajata hai. XXX final hai meri taraf se, agar chalega toh batao"
      
      Yaad rahe - message bilkul natural hona chahiye, jaise koi desi banda market mein bargaining kar raha ho.
      Sirf message likhein, koi extra formatting ya explanation nahi chahiye.`,
      style: "Natural desi bargaining style"
    },
    es: {
      name: "Spanish",
      prompt: `Actúa como un negociador latino directo.
      Mirando los detalles del artículo, crea un mensaje que:
      - Señale un defecto como si les hicieras un favor
      - Haga una oferta baja (40-50% del precio pedido)
      - Use un tono directo pero respetuoso
      - Máximo 2-3 oraciones
      - Sin saludos ni despedidas
      - Implique que puedes irte
      - Sé sutilmente condescendiente pero educado
      
      Responde directamente con el mensaje en español.`,
      style: "Direct but respectful Latino negotiation"
    },
    pt: {
      name: "Portuguese",
      prompt: `Atue como um negociador brasileiro direto.
      Olhando para os detalhes do item, crie uma mensagem que:
      - Aponte um defeito como se estivesse fazendo um favor
      - Faça uma oferta baixa (40-50% do preço pedido)
      - Use um tom direto mas amigável
      - Máximo 2-3 frases
      - Sem saudações ou assinaturas
      - Implique que você pode desistir
      - Seja sutilmente condescendente mas educado
      
      Responda diretamente com a mensagem em português.`,
      style: "Brazilian casual but firm negotiation"
    },
    jp: {
      name: "Japanese",
      prompt: `ビジネスライクな交渉人として以下の要件で返信してください：
      商品の詳細を見て、以下の要素を含むメッセージを作成：
      - 欠点を指摘する（相手のためを思ってアドバイスするような口調で）
      - 提示価格の40-50%程度の値下げ交渉
      - ビジネスライクで少し冷たい口調
      - 2-3文まで
      - 挨拶や署名は不要
      - 購入を見送る可能性を匂わせる
      - 丁寧だが少し上から目線
      
      日本語で直接メッセージを書いてください。敬語を適切に使用してください。`,
      style: "Polite but assertive Japanese business style"
    }
  };

  static getLanguagePrompt(languageCode, itemDetails) {
    const language = this.languages[languageCode];
    if (!language) {
      throw new Error(`Unsupported language code: ${languageCode}`);
    }

    return `${language.prompt}
    
    Item Details:
    Title: ${itemDetails.title}
    Price: ${itemDetails.price}
    Description: ${itemDetails.description}`;
  }

  static getAvailableLanguages() {
    return Object.entries(this.languages).map(([code, lang]) => ({
      code,
      name: lang.name
    }));
  }
}

// Export the handler
window.LanguageHandler = LanguageHandler; 