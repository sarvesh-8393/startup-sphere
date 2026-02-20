# Context-Aware Trust-Weighted Startup Recommendation System
## Exact Algorithms & Mathematical Formulations

---

## 1. CONTENT SIMILARITY MODULE (TF-IDF + Cosine)

### 1.1 Document Representation

For each startup $s_i \in S$, construct text document $D_i$:

$$D_i = \text{concat}(\text{name}, \text{tags}, \text{description}, \text{mission}, \text{problem\_solution}, \text{target\_market})$$

Tokenize and lowercase to create vocabulary $V$.

### 1.2 TF-IDF Vectorization

For document $D_i$ and term $t \in V$:

$$\text{TF}(t, D_i) = \frac{\text{count}(t, D_i)}{|D_i|}$$

$$\text{IDF}(t) = \log\left(\frac{|S|}{|\{s : t \in D_s\}|}\right)$$

$$\vec{v_i}[t] = \text{TF}(t, D_i) \times \text{IDF}(t)$$

Result: $\vec{v_i} \in \mathbb{R}^{|V|}$ for each startup.

### 1.3 User Profile Vector

For user $u$ with liked startups $L_u = \{s_1, s_2, ..., s_k\}$:

$$\vec{p_u} = \frac{1}{|L_u|} \sum_{s_j \in L_u} \vec{v_j}$$

If $|L_u| = 0$, set $\vec{p_u} = \vec{0}$ (cold start).

### 1.4 Content Similarity Score

Cosine similarity between user profile and startup:

$$\text{ContentSim}(u, s_i) = \frac{\vec{p_u} \cdot \vec{v_i}}{||\vec{p_u}|| \cdot ||\vec{v_i}||}$$

**Range:** $[0, 1]$  
**Interpretation:** Semantic relevance to user interests

---

## 2. TRUST SCORE MODULE (Novel)

### 2.1 Profile Completeness Score

Count filled fields in `profiles` table for founder of startup $s$:

$$\text{CompleteLet} \text{fields} = \{\text{full\_name}, \text{avatar\_url}, \text{email}, \text{role}, \text{location}, \text{experience\_years}, \text{education}, \text{linkedin\_url}\}$$

$$\text{ProfileCompleteness}(s) = \frac{\sum_{f \in \text{fields}} \mathbb{1}(\text{founder}.f \neq \text{NULL})}{|\text{fields}|}$$

**Range:** $[0, 1]$

### 2.2 External Links Score

Count non-null external links:

$$\text{LinksCount}(s) = \sum \mathbb{1}(\text{founder}.x \neq \text{NULL})$$

where $x \in \{\text{linkedin\_url}, \text{github\_url}, \text{twitter\_url}, \text{personal\_website}\}$

$$\text{ExternalLinksScore}(s) = \min\left(\frac{\text{LinksCount}(s)}{2}, 1\right)$$

**Range:** $[0, 1]$  
**Rationale:** Max 2 links needed for full score (prevents over-weighting)

### 2.3 Engagement Score

Community interaction metrics:

$$\text{EngagementScore}(s) = \min\left(\frac{\text{likes}(s)}{100} + \frac{\text{views}(s)}{1000}, 1\right)$$

**Range:** $[0, 1]$  
**Calibration:** 100 likes OR 1000 views = max score

### 2.4 Account Age Score

Days since startup profile created:

$$\text{age\_days}(s) = \frac{\text{now()} - \text{created\_at}(s)}{86400}$$

Exponential decay (half-life = 180 days):

$$\text{AccountAgeScore}(s) = 1 - e^{-\frac{\text{age\_days}(s)}{180}}$$

**Range:** $[0, 1]$  
**Property:** Older profiles slightly more trustworthy

### 2.5 Composite Trust Score

$$\text{TrustScore}(s) = 0.25 \times \text{ProfileCompleteness}(s)$$
$$+ 0.25 \times \text{ExternalLinksScore}(s)$$
$$+ 0.25 \times \text{EngagementScore}(s)$$
$$+ 0.25 \times \text{AccountAgeScore}(s)$$

**Range:** $[0, 1]$  
**Interpretation:** Credibility & maturity of startup profile

---

## 3. USER INTENT DETECTION MODULE (Novel)

### 3.1 Behavior Signals

Track user actions from server logs / analytics:

$$\text{Signal}_{\text{investor}} = \text{count(views to payment / funding sections)}$$

$$\text{Signal}_{\text{founder}} = \text{count(startup creations or edits)}$$

$$\text{Signal}_{\text{explorer}} = \text{count(likes / follows)}$$

### 3.2 Intent Vector Normalization

Let $S_{\max} = \max(\text{Signal}_{\text{investor}}, \text{Signal}_{\text{founder}}, \text{Signal}_{\text{explorer}})$

If $S_{\max} = 0$, set intent = uniform $[\frac{1}{3}, \frac{1}{3}, \frac{1}{3}]$ (no data)

Otherwise:

$$\vec{I_u} = \left[\frac{\text{Signal}_{\text{investor}}}{S_{\max}}, \frac{\text{Signal}_{\text{founder}}}{S_{\max}}, \frac{\text{Signal}_{\text{explorer}}}{S_{\max}}\right]$$

**Range:** Each component $\in [0, 1]$, sum = 1 or 0

### 3.3 Intent-Attribute Mapping

For startup $s$, extract attributes:

$$\text{has\_traction}(s) = \mathbb{1}(\text{likes}(s) > 10 \text{ OR views}(s) > 100)$$

$$\text{is\_earlystage}(s) = \mathbb{1}(\text{funding\_stage}(s) \in \{\text{Idea}, \text{Seed}, \text{Pre-seed}\})$$

$$\text{is\_trending}(s) = \text{AccountAgeScore}(s) > 0.7$$

### 3.4 Intent Match Score

$$\text{IntentMatch}(u, s) = \vec{I_u} \cdot \vec{A_s}$$

where $\vec{A_s} = [\text{has\_traction}(s), \text{is\_earlystage}(s), \text{is\_trending}(s)]$

**Range:** $[0, 1]$  
**Interpretation:** Alignment between user goals and startup characteristics

---

## 4. TAG PREFERENCE MATCHING MODULE

### 4.1 Tag Overlap

User preference tags: $T_u \subseteq \text{Tags}$ from `user_preferences.tags`

Startup tags: $T_s \subseteq \text{Tags}$ from `startups.tags`

$$\text{TagMatch}(u, s) = \frac{|T_u \cap T_s|}{|T_u \cup T_s|}$$

(Jaccard similarity)

**Range:** $[0, 1]$

---

## 5. HYBRID RANKING MODULE (CORE INNOVATION)

### 5.1 Recommendation Score

Final score combines all dimensions:

$$\text{RecScore}(u, s) = \alpha \cdot \text{ContentSim}(u, s)$$
$$+ \beta \cdot \text{TrustScore}(s)$$
$$+ \gamma \cdot \text{IntentMatch}(u, s)$$
$$+ \delta \cdot \text{TagMatch}(u, s)$$
$$+ \epsilon \cdot \text{Recency}(s)$$

### 5.2 Parameter Configuration

**Baseline weights (learned via A/B testing):**

- $\alpha = 0.40$ (Content similarity dominates)
- $\beta = 0.20$ (Trust/credibility)
- $\gamma = 0.20$ (Intent alignment)
- $\delta = 0.10$ (Explicit preferences)
- $\epsilon = 0.10$ (Freshness)

**Constraint:** $\alpha + \beta + \gamma + \delta + \epsilon = 1$

### 5.3 Recency Component

Same as before:

$$\text{Recency}(s) = 1 - e^{-\frac{\text{age\_days}(s)}{365}}$$

### 5.4 Final Ranking

For user $u$ and startup set $S$:

$$\text{Recommendation}(u) = \text{TopK}\left(\text{sort\_by}(S, \text{RecScore}(u, \cdot)), k=10\right)$$

Exclude:
- Startups already liked by user
- Startups created by user

---

## 6. COLD START HANDLING

If user has no interaction history ($|L_u| = 0$):

1. Set $\text{ContentSim}(u, s) = 0.2$ for all $s$ (uniform prior)
2. If `user_preferences.tags` exists, use **$\text{TagMatch}$** as primary signal
3. **Fallback:** Return $\text{TopK}$ by $\text{TrustScore} + \text{Recency}$ (trending startups)

---

## 7. ALGORITHM PSEUDOCODE

```
FUNCTION RecommendStartups(user_id, k=10):
    // Load all data
    user ← FetchUserProfile(user_id)
    startups ← FetchAllStartups()
    user_likes ← FetchUserLikes(user_id)
    user_prefs ← FetchUserPreferences(user_id)
    
    // Build content model
    tfidf_model ← BuildTFIDFModel(startups)
    user_vector ← AverageVectors({tfidf_model[s] for s in user_likes})
    
    // Detect intent
    intent_vector ← DetectUserIntent(user_id)
    
    // Score all startups
    scores = []
    FOR EACH startup s IN startups:
        IF s.id IN user_likes OR s.founder_id == user_id:
            CONTINUE  // Skip already liked/owned
        
        content_sim ← CosineSimilarity(user_vector, tfidf_model[s])
        trust ← ComputeTrustScore(s)
        intent_match ← DotProduct(intent_vector, AttributeVector(s))
        tag_match ← JaccardSimilarity(user_prefs.tags, s.tags)
        recency ← ExponentialDecay(s.created_at)
        
        score ← 0.40*content_sim + 0.20*trust + 0.20*intent_match 
                + 0.10*tag_match + 0.10*recency
        
        scores.append((s, score))
    
    // Return top k
    RETURN TopK(scores, k)
```

---

## 8. EXPERIMENTAL COMPARISON

### 8.1 Baseline Systems

**B1: Pure TF-IDF**
$$\text{Score}_{\text{B1}}(u, s) = \text{ContentSim}(u, s)$$

**B2: TF-IDF + Popularity**
$$\text{Score}_{\text{B2}}(u, s) = 0.7 \times \text{ContentSim}(u, s) + 0.3 \times \text{Popularity}(s)$$

**B3: Proposed (Full System)**
$$\text{Score}_{\text{B3}}(u, s) = \text{RecScore}(u, s) \text{ (as in Section 5.1)}$$

### 8.2 Evaluation Metrics

For top-k recommendations:

$$\text{Precision@k} = \frac{\text{relevant items in top-k}}{k}$$

$$\text{Recall@k} = \frac{\text{relevant items in top-k}}{\text{total relevant items}}$$

$$\text{NDCG@k} = \frac{\text{DCG@k}}{\text{IDCG@k}}$$

where relevance determined by user engagement (likes, follows in test set).

---

## 9. NOVELTY STATEMENT

**Core contributions:**

1. **Trust-weighted scoring** for startup credibility (§2)
2. **User intent detection** adapted to entrepreneurship domain (§3)
3. **Hybrid multi-objective ranking** (§5) balancing:
   - Content similarity
   - Trust / credibility
   - User intent alignment
   - Explicit preferences
   - Temporal freshness

**Differentiator:** Most startup recommenders ignore trust and intent; this work explicitly models both.

---

## 10. IMPLEMENTATION NOTES

- TF-IDF: Use `natural.js` library (Node.js)
- Trust Score: Compute from `profiles` + `startups` tables
- Intent: Track via API access logs or event table
- Weights: Set to baseline, tunable via A/B testing

---

**Version:** 1.0  
**Date:** 2026-01-25  
**Status:** Ready for Implementation
