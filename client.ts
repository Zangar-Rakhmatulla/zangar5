import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import fs from "fs";
import path from "path";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../target/idl/anchor_counter.json"), "utf8")
  );
  const program = new Program(idl, provider);
  const wallet = provider.wallet.publicKey;

  const keys = await program.methods.initialize().accounts({ payer: wallet }).pubkeys();
  const counterPda = keys.counter!;
  console.log("Кошелёк:", wallet.toBase58());
  console.log("Program ID:", program.programId.toBase58());
  console.log("Counter PDA:", counterPda.toBase58());

  const existing = await provider.connection.getAccountInfo(counterPda);
  if (!existing) {
    console.log("--- Вызываем initialize ---");
    const sig = await program.methods.initialize().accounts({ payer: wallet }).rpc();
    console.log("Транзакция initialize:", sig);
  } else {
    console.log("Counter бұрыннан бар, initialize өткізілді");
  }

  console.log("--- Вызываем increment (1) ---");
  console.log("Транзакция increment:", await program.methods.increment().accounts({ authority: wallet }).rpc());

  console.log("--- Вызываем increment (2) ---");
  console.log("Транзакция increment:", await program.methods.increment().accounts({ authority: wallet }).rpc());

  console.log("--- Вызываем decrement ---");
  console.log("Транзакция decrement:", await program.methods.decrement().accounts({ authority: wallet }).rpc());

  const counter = await (program.account as any).counter.fetch(counterPda);
  console.log("=== Финальное состояние счётчика ===");
  console.log("count:", counter.count.toString());
  console.log("authority:", counter.authority.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
