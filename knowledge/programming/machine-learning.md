# Machine Learning & AI Basics

## What is Machine Learning
- **ML**: computers learn patterns from data without being explicitly programmed for every case
  - Traditional programming: rules + data → answers. ML: data + answers → rules
- **Supervised learning**: learn from labeled examples (input → known output)
  - Regression: predict continuous value (house price, temperature). Linear regression: y = mx + b
  - Classification: predict category (spam vs not, dog vs cat). Logistic regression, decision trees, random forests, SVM, neural networks
  - Training = minimize error between predictions and actual labels
- **Unsupervised learning**: find patterns in unlabeled data (no correct answers given)
  - Clustering: group similar items (customer segments, image compression). K-means, DBSCAN, hierarchical
  - Dimensionality reduction: compress data while preserving structure. PCA (principal component analysis), t-SNE, UMAP
  - Anomaly detection: find unusual data points (fraud detection, manufacturing defects)
- **Reinforcement learning**: agent learns by trial and error, receiving rewards/punishments
  - Used for: game playing (AlphaGo, chess bots), robotics, recommendation systems, self-driving cars
  - Key concepts: state, action, reward, policy (strategy for choosing actions)
  - Exploration vs exploitation: try new things vs use what works

## Key ML Concepts
- **Overfitting**: model learns training data too well (memorizes noise) → fails on new data
  - Signs: high training accuracy, low test accuracy. Fix: more data, simplify model, regularization, cross-validation, early stopping
- **Underfitting**: model too simple to capture patterns → poor on both training and test
  - Fix: more complex model, more features, train longer
- **Bias-variance tradeoff**: simple models (high bias, low variance — underfit), complex models (low bias, high variance — overfit)
  - Goal: find sweet spot that generalizes well
- **Training/validation/test split**: train set (model learns), validation set (tune hyperparameters), test set (final evaluation, used once)
  - Common split: 80/10/10 or 70/15/15. Cross-validation: multiple train/validation splits for robust estimates
- **Features**: input variables the model uses. Feature engineering: creating better features from raw data (domain knowledge)
  - Feature scaling: normalize values to similar ranges (neural nets, SVMs, k-means need this)
  - One-hot encoding: convert categories to binary vectors. Embeddings: learn dense vector representations (words, users, items)
- **Evaluation metrics**:
  - Classification: accuracy (overall correct), precision (of positive predictions, how many correct), recall (of actual positives, how many caught), F1 (harmonic mean of precision + recall), AUC-ROC (tradeoff between true positive and false positive rates)
  - For imbalanced classes (fraud: 99.9% legitimate, 0.1% fraud): accuracy is misleading — precision/recall/AUC better
  - Regression: MSE (mean squared error), MAE (mean absolute error), R² (variance explained)

## Neural Networks & Deep Learning
- **Neuron**: weighted sum of inputs → activation function → output
  - Weights: learned parameters. Activation functions: ReLU (most common, output = max(0,x)), sigmoid (0 to 1, for probabilities), tanh (-1 to 1), softmax (multi-class probabilities)
- **Layers**: input → hidden (1 to hundreds) → output. "Deep" = many hidden layers
  - Feedforward: standard connections. Each layer learns progressively more abstract features (edges → shapes → objects → faces)
- **Backpropagation**: how neural networks learn — calculate error, propagate backwards through layers, adjust weights using gradient descent
  - Chain rule of calculus allows computing gradients through many layers
- **Gradient descent**: iteratively adjust weights to minimize error
  - Learning rate: step size. Too big = overshoot. Too small = too slow. Adam optimizer: adapts learning rate per parameter
  - SGD (stochastic gradient descent): update on each sample (noisy but fast). Mini-batch: balance (typical batch size 32-256)
- **Convolutional Neural Networks** (CNN): for images, video
  - Convolution: filter slides over image, detects features (edges, textures). Pooling: downsample (keep important info, reduce size)
  - Architecture pattern: conv → pool → conv → pool → flatten → dense → output. Famous architectures: ResNet (skip connections), VGG, EfficientNet, YOLO (real-time object detection)
- **Recurrent Neural Networks** (RNN): for sequences (text, audio, time series)
  - Maintains hidden state = memory of previous inputs. Problems: vanishing/exploding gradients (hard to learn long-range patterns)
  - LSTM (Long Short-Term Memory): solves vanishing gradient with gates (forget, input, output). GRU: simplified LSTM
- **Transformers** (the "T" in ChatGPT): dominant architecture for NLP and beyond
  - Self-attention: each word looks at all other words, learns which are important (context)
  - Parallel processing (unlike RNNs which process sequence one step at a time) → way faster, enables massive scale
  - Architecture: encoder (understanding) + decoder (generating) — GPT uses only decoder, BERT uses only encoder
  - Key innovations: positional encoding (word order), multi-head attention (different relationship types), layer normalization, residual connections

## Large Language Models (LLMs)
- **Training**: pre-training on massive text (internet, books, Wikipedia) → next word prediction. Then fine-tuning on specific tasks/instruction following
  - Pre-training: unsupervised, learns language patterns, grammar, facts, reasoning — costs $10-100M+ (GPT-4)
  - Fine-tuning: supervised on labeled examples (instruction + ideal response) — costs less but needs quality data
  - RLHF (Reinforcement Learning from Human Feedback): humans rank model outputs, reward model learns preferences, model trained to maximize reward — aligns model with human values
- **Context window**: how much text the model can process at once (GPT-3: 4K tokens, GPT-4: 8K-128K, Claude: 200K, Gemini: 1M+)
  - Larger context = more expensive compute (self-attention is O(n²) in sequence length)
- **Inference**: generating a response — autoregressive (predicts one token at a time, feeds its own output back)
  - Temperature: controls randomness (0 = deterministic, 1 = creative, >1 = chaotic). Top-p (nucleus sampling), top-k
  - KV cache: store intermediate computations to avoid re-computing for each new token — memory intensive
- **Prompt engineering**: designing inputs to get desired outputs
  - Few-shot: give examples in prompt. Chain-of-thought: "let's think step by step" — improves reasoning
  - System prompt: instructions to set model behavior (role, rules, constraints)

## Ethics & Risks
- **Bias**: models learn biases from training data (race, gender, socioeconomic) → can amplify discrimination
  - Example: hiring AI trained on past hires may perpetuate gender/racial bias
  - Mitigation: diverse training data, bias testing, careful evaluation, inclusive development teams
- **Hallucination**: models confidently generate false information — inherent to next-token prediction (they're trained to sound right, not be right)
  - Mitigation: RAG (retrieve factual information), proper prompting (cite sources, admit uncertainty), human oversight
- **Misuse**: deepfakes, misinformation, scams, automated harmful content (fraud, hate speech, CSAM)
  - Safety measures: content filtering, usage policies, watermarking, responsible release (staged, research first)
- **Job displacement**: AI will automate some jobs, create others, transform most — net effect uncertain
  - Likely changes: knowledge work augmentation > full replacement. Largest impact on content creation, customer service, translation, data analysis, coding
- **Existential risk** (long-term debate): could future AGI (artificial general intelligence) be uncontrollable or misaligned with human values? Opinions divided among experts
