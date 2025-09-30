const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local');
require('dotenv/config'); 
const { PublicKey } = require('@solana/web3.js'); 

// Your project services
const { getRecommendations } = require('./src/services/recommendation'); 
const { getHeliusAssets, getHeliusTransactions } = require('./src/services/helius');
const { resolveMint, getRouteQuote } = require('./src/services/jupiter'); 

// Initialize the bot with your token and session middleware
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Use the local session middleware to persist data
bot.use((new LocalSession({ database: 'bot_sessions.json' })).middleware());

/**
 * Validates a string to ensure it is a valid Solana wallet address.
 * @param {string} address The string to validate.
 * @returns {boolean} true if the address is a valid PublicKey, false otherwise.
 */
const isValidSolanaAddress = (address: any) => {
    try {
        new PublicKey(address);
        return true;
    } catch (e) {
        return false;
    }
};

// --- Helper Functions to Avoid Code Duplication ---

/**
 * Fetches and sends the user's wallet balances.
 * @param {object} ctx The Telegraf context object.
 * @param {string} walletAddress The wallet address to check.
 */
const sendBalances = async (ctx: any, walletAddress: any) => {
    const loadingMessage = await ctx.reply('🔍 Fetching your balances...');
    try {
        const holdings = await getHeliusAssets(walletAddress);
        
        let totalValue = 0;
        let message = '';

        if (holdings && holdings.length > 0) {
            // Calculate the total value of all holdings
            holdings.forEach((h: any) => {
                totalValue += h.balance * h.price;
            });
            message += `*Total Portfolio Value:* $${totalValue.toFixed(2)}\n\n`;
            message += `*Current Balances for ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}:*\n\n`;
            holdings.forEach((h: any) => {
                message += `*• ${h.symbol}:* ${h.balance.toFixed(4)} ($${(h.balance * h.price).toFixed(2)})\n`;
            });
        } else {
            message = `*Current Balances for ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}:*\n\n`;
            message += `ℹ No balances found for this address.`;
        }
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
        await ctx.deleteMessage(loadingMessage.message_id);
    } catch (error) {
        console.error('❌Error fetching balances:', error);
        await ctx.reply('❌Sorry, an error occurred while fetching balances. Check the address and try again.');
    }
};

/**
 * Fetches and sends the user's transaction history.
 * @param {object} ctx The Telegraf context object.
 * @param {string} walletAddress The wallet address to check.
 */
const sendHistory = async (ctx: any, walletAddress: any) => {
    const loadingMessage = await ctx.reply('🔍 Fetching transaction history...');
    try {
        const transactions = await getHeliusTransactions(walletAddress, 5);
        if (!transactions || transactions.length === 0) {
            await ctx.reply('ℹ No recent transactions found for that address.');
        } else {
            let message = `*Recent Transactions for ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}:*\n\n`;
            transactions.forEach((tx: any) => {
                const signature = tx.signature.slice(0, 8) + '...';
                const link = `https://solscan.io/tx/${tx.signature}`;
                const formattedType = tx.category
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (char: any) => char.toUpperCase());
                message += `*• Type:* ${formattedType}\n*• Signature:* [${signature}](${link})\n\n`;
            });
            await ctx.reply(message, { parse_mode: 'Markdown' });
        }
        await ctx.deleteMessage(loadingMessage.message_id);
    } catch (error) {
        console.error('❌ Error fetching transaction history:', error);
        await ctx.reply('❌ Sorry, an error occurred while fetching the transaction history. Please try again later.');
    }
};

/**
 * Analyzes and sends risk recommendations for a wallet.
 * @param {object} ctx The Telegraf context object.
 * @param {string} walletAddress The wallet address to analyze.
 */
const sendRiskAnalysis = async (ctx: any, walletAddress: any) => {
    const loadingMessage = await ctx.reply('⚙Analyzing your portfolio for risk...');
    try {
        const allRecommendations = await getRecommendations(walletAddress);
        const riskRecommendations = allRecommendations.filter((rec: any) => rec.type === 'Risk Management');
        
        if (riskRecommendations.length > 0) {
            let message = '*Risk Recommendations:*\n\n';
            riskRecommendations.forEach((rec: any) => {
                message += `*${rec.title}*\n`;
                message += `_${rec.description}_\n`;
                if (rec.action) {
                    message += `*Action:* \`${rec.action.type}\` on \`${rec.action.protocol}\`\n\n`;
                }
            });
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('✅No significant concentration risk was found in your portfolio.');
        }
        await ctx.deleteMessage(loadingMessage.message_id);
    } catch (error) {
        console.error('❌Error fetching risk recommendations:', error);
        await ctx.reply('❌Sorry, an error occurred while analyzing risk. Please try again later.');
    }
};

// --- Command Handlers ---

// The /start command handler
bot.start((ctx: any) => {
    ctx.session = { savedWallets: {}, defaultWalletAddress: null };
    ctx.reply('🤖Welcome to the AI Yield and Risk Optimizer Bot! You can send me a wallet address to get recommendations or use a command.');
});

// Command to initiate a balances check
bot.command('balances', async (ctx: any) => {
    if (ctx.session.defaultWalletAddress) {
        await sendBalances(ctx, ctx.session.defaultWalletAddress);
    } else {
        ctx.session.state = 'waitingForBalancesAddress';
        ctx.reply('🤖Please send me the **Solana wallet address** you want to check.', { parse_mode: 'Markdown' });
    }
});

// Command to initiate a transaction history check
bot.command('history', async (ctx: any) => {
    if (ctx.session.defaultWalletAddress) {
        await sendHistory(ctx, ctx.session.defaultWalletAddress);
    } else {
        ctx.session.state = 'waitingForHistoryAddress';
        ctx.reply('📜 Please send me the **Solana wallet address** to fetch its transaction history.', { parse_mode: 'Markdown' });
    }
});

// Command to initiate a risk analysis
bot.command('risk', async (ctx: any) => {
    if (ctx.session.defaultWalletAddress) {
        await sendRiskAnalysis(ctx, ctx.session.defaultWalletAddress);
    } else {
        ctx.session.state = 'waitingForRiskAddress';
        ctx.reply('🤖Please send me the **Solana wallet address** to analyze for risk.', { parse_mode: 'Markdown' });
    }
});

// Command to initiate a swap
bot.command('swap', (ctx: any) => {
    ctx.session.state = 'waitingForSwapParams';
    ctx.reply('Please send the tokens and amount you want to swap, like this: `SOL USDC 0.1`', { parse_mode: 'Markdown' });
});

// Command to save a wallet address
bot.command('save', (ctx: any) => {
    ctx.session.state = 'waitingForWalletNameAndAddress';
    ctx.reply('📝 To save your wallet, send me a name followed by the address, like this: `main YOUR_WALLET_ADDRESS`', { parse_mode: 'Markdown' });
});

// --- Dynamic Saved Wallet Commands Middleware ---
// This middleware must be placed before the bot.on('text') handler
bot.use(async (ctx: any, next: any) => {
    const message = ctx.message?.text?.trim()?.toLowerCase();
    if (message && message.startsWith('/')) {
        const command = message.substring(1);
        const savedWallets = ctx.session.savedWallets || {};
        const walletAddress = savedWallets[command];

        if (walletAddress) {
            ctx.session.state = 'none'; // Reset state to prevent double handling
            await sendBalances(ctx, walletAddress);
            return; // Stop processing further middleware
        }
    }
    return next();
});

// --- General Text Handler ---
// This handler now manages the conversation flow
bot.on('text', async (ctx: any) => {
    const userMessage = ctx.message.text.trim();
    const state = ctx.session.state;

    switch (state) {
        case 'waitingForBalancesAddress': {
            if (!isValidSolanaAddress(userMessage)) {
                return ctx.reply('⚠That doesn\'t look like a valid Solana wallet address. Please try again.');
            }
            ctx.session.state = 'none'; // Reset state
            await sendBalances(ctx, userMessage);
            break;
        }

        case 'waitingForHistoryAddress': {
            if (!isValidSolanaAddress(userMessage)) {
                return ctx.reply('⚠That doesn\'t look like a valid Solana wallet address. Please try again.');
            }
            ctx.session.state = 'none';
            await sendHistory(ctx, userMessage);
            break;
        }

        case 'waitingForRiskAddress': {
            if (!isValidSolanaAddress(userMessage)) {
                return ctx.reply('⚠That doesn\'t look like a valid Solana wallet address. Please try again.');
            }
            ctx.session.state = 'none';
            await sendRiskAnalysis(ctx, userMessage);
            break;
        }

        case 'waitingForSwapParams': {
            const args = userMessage.split(' ');
            if (args.length < 3 || isNaN(parseFloat(args[2]))) {
                return ctx.reply('🤖Please provide the tokens and amount, like this: `SOL USDC 0.1`', { parse_mode: 'Markdown' });
            }

            ctx.session.state = 'none';
            const fromToken = args[0];
            const toToken = args[1];
            const amount = parseFloat(args[2]);
            
            const inputMint = resolveMint(fromToken.toUpperCase());
            const outputMint = resolveMint(toToken.toUpperCase());

            if (!inputMint || !outputMint) {
                return ctx.reply(`⚠I couldn't find a mint address for ${fromToken} or ${toToken}.`);
            }

            const loadingMessage = await ctx.reply('⚙Finding the best swap route...');
            try {
                const inputDecimals = fromToken.toUpperCase() === 'SOL' ? 9 : (fromToken.toUpperCase() === 'USDC' ? 6 : 9);
                const amountInSmallestUnit = amount * Math.pow(10, inputDecimals);

                const jupiterQuote = await getRouteQuote({ 
                    inputMint, 
                    outputMint, 
                    amount: amountInSmallestUnit 
                });

                if (jupiterQuote && jupiterQuote.outAmount) {
                    const outDecimals = toToken.toUpperCase() === 'USDC' ? 6 : 9;
                    const outAmount = parseFloat(jupiterQuote.outAmount) / (10 ** outDecimals);
                    await ctx.reply(
                        `A swap of **${amount} ${fromToken.toUpperCase()}** for **~${outAmount.toFixed(4)} ${toToken.toUpperCase()}** is available.`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await ctx.reply(`No swap route found for ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}.`);
                }
                await ctx.deleteMessage(loadingMessage.message_id);
            } catch (error) {
                console.error('❌Error fetching swap quote:', error);
                await ctx.reply('❌An error occurred while fetching the swap quote. Please try again later.');
            }
            break;
        }

        case 'waitingForWalletNameAndAddress': {
            const [name, ...rest] = userMessage.split(' ');
            const address = rest.join(' ');
            
            if (!name || !isValidSolanaAddress(address)) {
                return ctx.reply('⚠ Invalid format. Please send a name and a valid Solana wallet address, like this: `main YOUR_WALLET_ADDRESS`');
            }

            ctx.session.savedWallets = ctx.session.savedWallets || {};
            ctx.session.savedWallets[name.toLowerCase()] = address;
            ctx.session.defaultWalletAddress = address; // Set as the new default
            ctx.session.state = 'none';
            
            ctx.reply(`✅ Wallet saved as \`${name}\` and set as your default! You can now use \`/${name}\` as a shortcut for balances.`, { parse_mode: 'Markdown' });
            break;
        }

        default: {
            if (isValidSolanaAddress(userMessage)) {
                ctx.session.defaultWalletAddress = userMessage; // Set as default wallet
                const loadingMessage = await ctx.reply('⚙Analyzing your wallet... This may take a moment.');
                try {
                    const recommendations = await getRecommendations(userMessage);
                    let responseMessage = '*🤖Here are your portfolio recommendations:*\n\n';

                    if (recommendations.length > 0) {
                        recommendations.forEach((rec: any) => {
                            responseMessage += `*${rec.title}*\n`;
                            responseMessage += `_${rec.description}_\n`;
                            if (rec.action) {
                                responseMessage += `*Action:* \`${rec.action.type}\` on \`${rec.action.protocol}\`\n\n`;
                            }
                        });
                    } else {
                        responseMessage = '✅No specific recommendations were found for your wallet at this time.';
                    }
                    await ctx.reply(responseMessage, { parse_mode: 'Markdown' });
                    await ctx.deleteMessage(loadingMessage.message_id);
                } catch (error) {
                    console.error('❌Error fetching recommendations:', error);
                    await ctx.reply('❌Sorry, an error occurred while analyzing your wallet. Please try again later.');
                }
            } else {
                ctx.reply('⚠That doesn\'t look like a valid Solana wallet address. Please send a valid address to get recommendations.');
            }
        }
    }
});

// Launch the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot is running...');
