# Builds do TAPeira

O jogo pode ser empacotado para Windows com Electron e para Android com Capacitor. Os dois formatos usam os mesmos arquivos HTML, CSS, JavaScript, imagens e sons.

## Requisitos

- Node.js LTS e npm.
- Windows para gerar o instalador `.exe`.
- Para Android: Android SDK (incluindo uma plataforma Android instalada) e JDK 21 configurado no `JAVA_HOME`. Android Studio é opcional para os builds por linha de comando.

Na primeira vez, na raiz do projeto:

```powershell
npm install
```

## Windows

Para executar durante o desenvolvimento:

```powershell
npm run start:pc
```

Para gerar o instalador x64:

```powershell
npm run build:pc
```

O instalador e os arquivos auxiliares são gerados em `dist/pc`. O instalador cria atalhos no menu Iniciar e na área de trabalho.
No aplicativo para Windows, Configurações permite escolher a resolução da janela e ativar tela cheia; essa preferência é mantida ao reabrir o jogo. O menu inicial também oferece Fechar jogo e salva o progresso antes de sair. O cursor de espada personalizado é exclusivo do aplicativo para PC.

## Android

Gere o projeto nativo Android uma vez:

```powershell
npm run android:init
```

Para sincronizar alterações web e gerar um APK de teste:

```powershell
npm run android:debug
```

O APK de teste fica em `android/app/build/outputs/apk/debug/app-debug.apk`.
Ao exportar um save, o jogo gera um arquivo JSON com nome único e abre o compartilhamento do sistema no Android; escolha um destino como Arquivos/Downloads ou Drive. No Windows, escolha o caminho no diálogo de salvamento; no navegador, o arquivo é baixado. Para restaurar o progresso em qualquer plataforma, abra Configurações e selecione esse `.json`.

Para abrir o projeto no Android Studio:

```powershell
npm run android:open
```

O comando `android:release` gera um APK sem assinatura de distribuição. Para publicar ou instalar como versão final, configure uma chave de assinatura no Android Studio/Gradle e proteja essa chave fora do projeto.

## Progresso salvo

O progresso automático é guardado localmente no perfil do aplicativo. Saves exportados em arquivo continuam disponíveis no menu Configurações e podem ser transferidos entre plataformas. Exporte um backup antes de atualizar o jogo e importe-o depois, se necessário. O JSON identifica o formato e a versão do save; saves antigos sem esses metadados continuam compatíveis, e versões futuras incompatíveis são recusadas sem substituir o progresso atual. A versão Android e a versão Windows mantêm dados locais separados.
