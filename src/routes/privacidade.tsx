import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de privacidade — BabyCare" }, { name: "description", content: "Como a BabyCare protege os dados das mães e bebés." }, { property: "og:title", content: "Política de privacidade — BabyCare" }, { property: "og:description", content: "Como protegemos os seus dados." }] }),
  component: () => (
    <div className="mx-auto max-w-md space-y-4 px-6 py-10 text-sm leading-relaxed">
      <Link to="/" className="font-display text-xl text-primary">BabyCare</Link>
      <h1 className="text-2xl">Política de privacidade</h1>
      <p>Recolhemos apenas os dados necessários para personalizar a sua experiência: o seu nome, país, e o nome, data de nascimento e sexo do bebé, bem como os registos que introduz.</p>
      <p>Os seus dados são privados: só a sua conta tem acesso aos registos do bebé. Não vendemos dados a terceiros.</p>
      <p>Ao criar conta, confirma que é responsável legal pelo bebé e consente o tratamento destes dados. Pode pedir a eliminação da conta a qualquer momento.</p>
      <p>Os conteúdos são educativos, revistos por profissionais de saúde, e não substituem aconselhamento clínico. O assistente não faz diagnósticos.</p>
      <p>Na comunidade, é proibido partilhar dados pessoais dos bebés (nomes completos, contactos, localização) e conselhos médicos perigosos.</p>
    </div>
  ),
});
