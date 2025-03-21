<div>

    Below are some of the methodologies available/ under research in industry and widely discussed in the context of internal transparency.
    You can choose explanation methods according to the actual situation.

</div>


<div class="table_box">
    <table border="1">
            <tr>
                <th rowspan="2">Model agnostic methods</th>
                <th>Global explanation methods</th>
                <td>
                    <ul>
                    <li>Partial dependence plots - PDPs</li>
                    <li>Accumulated local effects - ALE </li>
                    <li>Permutation Importance</li>
                    <li>Global surrogate models</li>
                    </ul>
                </td>
            </tr>
            <tr>
                 <th>Local explanation methods</th>
                 <td>
                     <ul>
                     <li>Local interpretable model-agnostic explanations (LIME)</li>
                     <li>ALocal surrogate techniques like breakdown and high precision anchors</li>
                     <li>Shapley values (popular approximation techniques include quantitative input influence (QII) and Shapley additive explanations (SHAP))</li>
                     <li>Global surrogate models</li>
                     </ul>
                 </td>
             </tr>
            <tr>
                 <th rowspan="2">Model specific methods</th>
                 <th>Linear model and decision tree methods</th>
                 <td>
                     <ul>
                     <li>Examining coefficients in linear models</li>
                     <li>Generating global feature importance in decision trees by examining Gini impurities of feature splits within a tree</li>
                     </ul>
                 </td>
            </tr>
            <tr>
                 <th>Gradient based deep neural networks (DNN) methods</th>
                 <td>
                     <ul>
                     <li>SmoothGrad saliency maps</li>
                     <li>Guided backpropagation</li>
                     <li>Layer wise relevance propagation</li>
                     <li>Grad-CAM</li>
                     <li>Integrated gradients</li>
                     </ul>
                 </td>
            </tr>
            <tr>
                 <th>Conceptual soundness method</th>
                 <td colspan="2">
                     <ul>
                     <li>Influence Sensitivity plots</li>
                     </ul>
                 </td>
            </tr>
     </table>
 </div>



