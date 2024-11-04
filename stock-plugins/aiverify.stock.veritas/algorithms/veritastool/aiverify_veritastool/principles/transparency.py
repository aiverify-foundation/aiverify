import base64
import copy
import io

import matplotlib.pyplot as pl
import numpy as np
import pandas as pd
import shap
from IPython.display import display_html
from shap import Explanation
from sklearn.inspection import PartialDependenceDisplay
from tqdm.auto import tqdm

from ..config.constants import Constants
from ..metrics.performance_metrics import PerformanceMetrics
from ..util.utility import process_y_prob


class Transparency:
    """
    Base Class with attributes for transparency analysis.
    """

    def __init__(
        self,
        tran_row_num=[1],
        tran_max_sample=1,
        tran_pdp_feature=[],
        tran_pdp_target=None,
        tran_max_display=10,
        tran_features=[],
        tran_processed_data=None,
        tran_processed_label=None,
    ):
        """
        Parameters
        ------------------
        tran_row_num : list/np.array/pd.Series
                It holds the list of indices given by the user for which the user wants to see the local interpretability.
                (tran_row_num refers to row number mapping from the x_train data set and the input starts from 1.)

        tran_max_sample : int/float
                Stores the number of records user wants in the sample. If none is given, the entire dataset will be considered.
                A float value between 0 and 1 is considered as percentage.
                A value greater than 1 is considered as number of rows.

        tran_pdp_feature : list
                Stores the list of features for which user wants to see the partial dependence plot.
                Can pass upto 2 features. If none is passed, plot for top 2 features from global interpretability will be shown by default.

        tran_pdp_target : str/int
                Stores the target class to be used for partial dependence in the case of a multi-class model.
                If none is given, the first positive label value will be taken by default.

        tran_max_display : int
                Stores the number of features user wants to see in output.
                A value of 0 is used for consideration of all features. If none is passed, 10 is considered as default.

        tran_features : list
                Stores the list of features user wants to see in the output.

        tran_processed_data : dataframe, default=None
                Stores the processed dataframe which will be used to create the shap values.
                This will be created basis the x_train and the tran_max_sample. In case x_train is a string, user can directly pass the tran_processed_data.
                This must be passed along with tran_processed_label to be considered as valid input.

        tran_processed_label : list, default=None
                Stores the y_train data that the user must pass along with the tran_processed_data in case x_train is a string.
                y_train is a list of np.array or list or pd.series with length equal to number of models in the container.

        Instance Attributes
        -------------------
        tran_shap_values : dict, default = {}
                Stores the shap values obtained for each model where model number is the key.

        tran_shap_extra : dict, default = {}
                Stores the shap base values obtained for each model where model number is the key.


        tran_top_features : dict, default = {}
                Stores a dataframe of features along with their importances for each model where model number is the key.

        tran_pdp_feature_processed : dict, default = {}
                Stores the list of 2 features for which partial dependence plot has to be made for each model where model number is the key.

        permutation_importance : dataframe, default = Blank dataframe with columns : feature, diff and neg_flag
                Stores the features, their importances and negative value flag for the given usecase.

        tran_flag : dict, default = {}
                Stores a flag for whether the data sampling has been done or not. For each model, it also stores flags for data preparation, interpretability, partial dependence and permutation importance status.

        tran_results : dict, default = {}
                Stores the dictionary containing all the required transparency output.

        """
        self.tran_max_sample = tran_max_sample
        self.tran_pdp_feature = tran_pdp_feature
        self.tran_pdp_target = tran_pdp_target
        self.tran_max_display = tran_max_display
        self.tran_row_num = tran_row_num
        self.tran_features = tran_features
        self.tran_processed_data = tran_processed_data
        self.tran_processed_label = tran_processed_label
        self.tran_shap_values = {}
        self.tran_shap_extra = {}
        self.tran_top_features = {}
        self.tran_pdp_feature_processed = {}
        self.permutation_importance = pd.DataFrame(columns=["feature", "diff", "neg_flag"])
        self.tran_flag = {"data_sampling_flag": False}
        self.tran_results = {
            "permutation": {"title": "", "footnote": "", "score": ""},
            "model_list": [],
        }

        if (
            self.tran_processed_data is not None
            and type(self.tran_processed_data) == pd.DataFrame
            and self.tran_processed_label is not None
        ):
            self.tran_input_features = {
                "shape": self.tran_processed_data.shape,
                "columns": self.tran_processed_data.columns,
                "check_input_flag": 0,
            }
        elif (
            self.model_params[0].x_train is not None
            and self.model_params[0].y_train is not None
            and type(self.model_params[0].x_train) != str
        ):
            self.tran_input_features = {
                "shape": self.model_params[0].x_train.shape,
                "columns": self.model_params[0].x_train.columns,
                "check_input_flag": 1,
            }
        else:
            self.tran_input_features = {
                "shape": "",
                "columns": "",
                "check_input_flag": 2,
            }

        for i in range(len(self.model_params)):
            self.tran_results["model_list"].append(
                {
                    "id": i,
                    "summary_plot_data_table": "",
                    "summary_plot": "",
                    "local_interpretability": [],
                    "partial_dependence_plot": {},
                    "plot": {"local_plot": {}, "class_index": {}, "pdp_plot": {}},
                }
            )
            self.tran_flag[i] = {
                "interpret": False,
                "partial_dep": False,
                "perm_imp": False,
                "data_prep_flag": False,
            }

    def _tran_check_input(self):
        """
        Check if the inputs of transparency analysis are valid.

        Returns
        ----------
        Returns the appropriate error message, if any.
        """
        if self.tran_input_features["check_input_flag"] != 2:
            self._check_tran_row_num()
            self._check_tran_max_sample()
            self._check_tran_pdp_feature()
            self._check_tran_pdp_target()
            self._check_tran_max_display()
            self._check_tran_features()
        self._check_tran_processed_input()
        self.err.pop()

    def _check_tran_row_num(self):
        if type(self.tran_row_num) not in [list, np.ndarray, pd.Series]:
            self.err.push(
                "type_error",
                var_name="tran_row_num",
                given=type(self.tran_row_num),
                expected="list or numpy array or pandas series",
                function_name="_tran_check_input",
            )
        else:
            if type(self.tran_row_num) in [np.ndarray, pd.Series]:
                self.tran_row_num = self.tran_row_num.tolist()
            for j, i in enumerate(self.tran_row_num):
                if type(i) not in [int, float]:
                    self.err.push(
                        "type_error",
                        var_name="tran_row_num",
                        given=type(i),
                        expected="integer values",
                        function_name="_tran_check_input",
                    )
                elif not (1 <= int(i) <= self.tran_input_features["shape"][0]):
                    self.err.push(
                        "value_error",
                        var_name="tran_row_num",
                        given=i,
                        expected="Index within range 1 - " + str(self.tran_input_features["shape"][0]),
                        function_name="_tran_check_input",
                    )
                if type(i) == float:
                    self.tran_row_num[j] = int(i)

    def _check_tran_max_sample(self):
        if self.tran_input_features["check_input_flag"] == 1:
            if type(self.tran_max_sample) not in [int, float]:
                self.err.push(
                    "type_error",
                    var_name="tran_max_sample",
                    given=type(self.tran_max_sample),
                    expected="int or float",
                    function_name="_tran_check_input",
                )
            elif (type(self.tran_max_sample) == float) and not (0 < self.tran_max_sample < 1):
                self.err.push(
                    "value_error",
                    var_name="tran_max_sample",
                    given=self.tran_max_sample,
                    expected="Float value between 0 and 1",
                    function_name="_tran_check_input",
                )
            elif (type(self.tran_max_sample) == int) and not (
                1 <= self.tran_max_sample <= self.tran_input_features["shape"][0]
            ):
                self.err.push(
                    "value_error",
                    var_name="tran_max_sample",
                    given=self.tran_max_sample,
                    expected="Value between range 1 - " + str(self.tran_input_features["shape"][0]),
                    function_name="_tran_check_input",
                )

    def _check_tran_pdp_feature(self):
        if type(self.tran_pdp_feature) != list:
            self.err.push(
                "type_error",
                var_name="tran_pdp_feature",
                given=type(self.tran_pdp_feature),
                expected="list",
                function_name="_tran_check_input",
            )
        else:
            for i in self.tran_pdp_feature[:2]:
                if type(i) != str:
                    self.err.push(
                        "type_error",
                        var_name="tran_pdp_feature",
                        given=type(i),
                        expected="list of string",
                        function_name="_tran_check_input",
                    )
                elif i not in self.tran_input_features["columns"]:
                    self.err.push(
                        "value_error",
                        var_name="tran_pdp_feature",
                        given=i,
                        expected="Feature value within available feature list",
                        function_name="_tran_check_input",
                    )

    def _check_tran_pdp_target(self):
        if self.model_params[0].model_type != "regression" and self.model_params[0].model_object is not None:
            if (self.tran_pdp_target is not None) and len(self.model_params[0].model_object.classes_) > 2:
                if type(self.tran_pdp_target) not in [str, int]:
                    self.err.push(
                        "type_error",
                        var_name="tran_pdp_target",
                        given=type(self.tran_pdp_target),
                        expected="str/int",
                        function_name="_tran_check_input",
                    )
                elif self.tran_pdp_target not in self.model_params[0].model_object.classes_:
                    self.err.push(
                        "value_error",
                        var_name="tran_pdp_target",
                        given=self.tran_pdp_target,
                        expected="Target value from model class labels - "
                        + str(self.model_params[0].model_object.classes_),
                        function_name="_tran_check_input",
                    )

    def _check_tran_max_display(self):
        if type(self.tran_max_display) == float:
            self.tran_max_display = int(self.tran_max_display)
        if type(self.tran_max_display) != int:
            self.err.push(
                "type_error",
                var_name="tran_max_display",
                given=type(self.tran_max_display),
                expected="int",
                function_name="_tran_check_input",
            )
        elif self.tran_max_display == 0:
            self.tran_max_display = self.tran_input_features["shape"][1]
        elif self.tran_max_display < 2:
            self.err.push(
                "value_error",
                var_name="tran_max_display",
                given=self.tran_max_display,
                expected="Value between range 2 - " + str(self.tran_input_features["shape"][1]),
                function_name="_tran_check_input",
            )
        else:
            self.tran_max_display = min(self.tran_max_display, self.tran_input_features["shape"][1])

    def _check_tran_features(self):
        if type(self.tran_features) != list:
            self.err.push(
                "type_error",
                var_name="tran_features",
                given=type(self.tran_features),
                expected="list",
                function_name="_tran_check_input",
            )
        else:
            for i in self.tran_features:
                if type(i) != str:
                    self.err.push(
                        "type_error",
                        var_name="tran_features",
                        given=type(self.tran_features),
                        expected="str",
                        function_name="_tran_check_input",
                    )
                elif i not in self.tran_input_features["columns"]:
                    self.err.push(
                        "value_error",
                        var_name="tran_features",
                        given=i,
                        expected="Feature value within available feature list",
                        function_name="_tran_check_input",
                    )

    def _check_tran_processed_input(self):
        if self.tran_processed_data is not None and self.tran_processed_label is not None:
            if type(self.tran_processed_data) != pd.DataFrame:
                self.err.push(
                    "type_error",
                    var_name="tran_processed_data",
                    given=type(self.tran_processed_data),
                    expected="Dataframe",
                    function_name="_tran_check_input",
                )
            if type(self.tran_processed_label) != list:
                self.err.push(
                    "type_error",
                    var_name="tran_processed_label",
                    given=type(self.tran_processed_label),
                    expected="list",
                    function_name="_tran_check_input",
                )
            elif len(self.tran_processed_label) != len(self.model_params):
                self.err.push(
                    "value_error",
                    var_name="tran_processed_label",
                    given=len(self.tran_processed_label),
                    expected="length equal to length of model params : " + str(len(self.model_params)),
                    function_name="_tran_check_input",
                )
            else:
                for i in self.tran_processed_label:
                    if type(i) not in [np.ndarray, list, pd.Series]:
                        self.err.push(
                            "type_error",
                            var_name="tran_processed_label",
                            given=type(i),
                            expected="np.ndarray or pd.Series or list",
                            function_name="_tran_check_input",
                        )
                    elif type(self.tran_processed_data) == pd.DataFrame and len(i) != len(self.tran_processed_data):
                        self.err.push(
                            "value_error",
                            var_name="tran_processed_label",
                            given=len(i),
                            expected="length equal to length of processed data : " + str(len(self.tran_processed_data)),
                            function_name="_tran_check_input",
                        )

    def _shap(self, model_num=0):
        """
        Calculates shap values for the given model and dataset

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It stores the shap values and base values in the attributes tran_shap_values and tran_shap_extra respectively.
        """
        if self.model_params[model_num].model_type == "regression":
            explainer_shap = shap.Explainer(
                self.model_params[model_num].model_object.predict,
                self.tran_processed_data,
            )
            explanation = explainer_shap(self.tran_processed_data)
            self.tran_shap_extra[model_num] = explanation.base_values
            self.tran_shap_values[model_num] = explanation.values
        else:
            explainer_shap = shap.Explainer(
                self.model_params[model_num].model_object.predict_proba,
                self.tran_processed_data,
            )
            explanation = explainer_shap(self.tran_processed_data)
            base = explanation.base_values
            shap_values = np.moveaxis(explanation.values, -1, 0)
            if shap_values.shape[0] == 2:
                idx = list(self.model_params[0].model_object.classes_).index(self.model_params[0].pos_label[0])
                shap_values = shap_values[idx]
                base = base[:, idx]
            else:
                shap_values = list(shap_values)
            self.tran_shap_values[model_num] = shap_values
            self.tran_shap_extra[model_num] = base

    def _data_sampling(self):
        """
        Creates the processed data based on the user input of tran_max_sample and tran_row_num.

        Returns
        ----------
        This function does not return anything. It creates the processed data.
        """
        if self.tran_input_features["check_input_flag"] == 1:
            if 0 < self.tran_max_sample < 1:
                self.tran_max_sample = round(self.tran_max_sample * self.model_params[0].x_train.shape[0])
            elif 1 < self.tran_max_sample <= self.model_params[0].x_train.shape[0]:
                self.tran_max_sample = round(self.tran_max_sample)
            else:
                self.tran_max_sample = self.model_params[0].x_train.shape[0]

            self.tran_processed_data = self.model_params[0].x_train.sample(n=self.tran_max_sample, random_state=0)

            if self.model_params[0].model_type != "regression":
                y_train = pd.Series(self.model_params[0].y_train)
                label = set(y_train[self.tran_processed_data.index])
                missed = set(self.model_params[0].model_object.classes_) - label
                if missed:
                    new_rows = []
                    for idx, value in y_train.items():
                        if value in missed:
                            new_rows.append(idx)
                            missed.remove(value)
                            if not missed:
                                break
                    if new_rows:
                        self.tran_processed_data = pd.concat(
                            [
                                self.tran_processed_data,
                                self.model_params[0].x_train.loc[new_rows],
                            ]
                        )

        diff = set(x - 1 for x in self.tran_row_num) - set(self.tran_processed_data.index)
        if diff:
            self.tran_processed_data = pd.concat(
                [
                    self.tran_processed_data,
                    self.model_params[0].x_train.loc[list(diff)],
                ]
            )

    def _top_features(self, model_num=0):
        """
        Creates a dictionary of dataframe of features and their shap values for the given model.

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It stores the top features and their shap values in tran_top_features with model number as the key.
        """
        if type(self.tran_shap_values[model_num]) == list:
            importances = np.sum(np.mean(np.abs(self.tran_shap_values[model_num]), axis=1), axis=0)
        else:
            importances = np.mean(np.abs(self.tran_shap_values[model_num]), axis=0)
        features = self.tran_processed_data.columns
        feature_imp = pd.DataFrame({"Feature_name": features, "mean(|shap|)": importances})
        feature_imp.sort_values(by=["mean(|shap|)"], ascending=False, inplace=True)
        self.tran_top_features[model_num] = feature_imp

    def _plot_encode(self, f, plot=None):
        """
        Encodes the plot image as binary encoding and/or base64.

        Parameters
        ------------------
        f : fig
                It holds the fogure which needs to be encoded.

        plot : str, default = None
                It holds the plot type basis which it's decided if base64 encoding needs to be done or not

        Returns
        ----------
        It returns the base64 encoding for the json output and binary encoding for plotting in the notebook.
        """
        buff = io.BytesIO()
        f.savefig(buff, format="raw")
        buff.seek(0)
        data = np.frombuffer(buff.getvalue(), dtype=np.uint8)
        w, h = f.canvas.get_width_height()
        im = data.reshape((int(h), int(w), -1))

        image_64_encodeutf = ""
        if plot is not None:
            buffer = io.BytesIO()
            f.savefig(buffer, format="png")
            image_64_encode = base64.b64encode(buffer.getvalue())
            image_64_encodeutf = image_64_encode.decode("utf-8")
        if image_64_encodeutf != "":
            return im, image_64_encodeutf
        else:
            return im

    def _global(self, model_num=0):
        """
        Computes the global interpretability on the processed data.

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It stores the global interpretability values/plot in the dictionary.
        """
        if self.tran_features == []:
            if type(self.tran_shap_values[model_num]) == list:
                f = pl.gcf()
                shap.summary_plot(
                    self.tran_shap_values[model_num],
                    self.tran_processed_data,
                    class_names=self.model_params[model_num].model_object.classes_,
                    max_display=self.tran_max_display,
                    show=False,
                )
                im, image_base_64 = self._plot_encode(f, plot="summary_plot")
                pl.close()
            else:
                f = pl.gcf()
                shap.summary_plot(
                    self.tran_shap_values[model_num],
                    self.tran_processed_data,
                    max_display=self.tran_max_display,
                    show=False,
                )
                im, image_base_64 = self._plot_encode(f, plot="summary_plot")
                pl.close()

            self.tran_results["model_list"][model_num]["summary_plot"] = image_base_64
            self.tran_results["model_list"][model_num]["summary_plot_data_table"] = None
            self.tran_results["model_list"][model_num]["plot"]["summary"] = im

        else:
            summary = self.tran_top_features[model_num][
                np.isin(self.tran_top_features[model_num], self.tran_features).any(axis=1)
            ]
            self.tran_results["model_list"][model_num]["summary_plot_data_table"] = summary.to_dict(orient="records")
            self.tran_results["model_list"][model_num]["summary_plot"] = None
            self.tran_results["model_list"][model_num]["plot"]["summary"] = ""

    def _local(self, n, model_num=0):
        """
        Computes the local interpretability values for the index provided by the user.

        Parameters
        -----------
        n : int
                Row number for which the local interpretability is to be calculated.
                (Row numbers refers to row number mapping from the x_train data set and the input starts from 1.)

        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It saves the local interpretability plot/values in the results dictionary.
        """
        class_index = "NA"
        ind = []
        for i in range(len(self.tran_results["model_list"][model_num]["local_interpretability"])):
            ind.append(self.tran_results["model_list"][model_num]["local_interpretability"][i]["id"])
        if n not in ind:
            # creating class index and explanation scenarios based on the model type
            if (self.model_params[model_num].model_type) != "regression":
                if len(self.model_params[model_num].model_object.classes_) > 2:
                    if self.tran_input_features["check_input_flag"] == 1:
                        class_index = list(self.model_params[model_num].model_object.classes_).index(
                            np.array(self.model_params[model_num].y_train)[n - 1]
                        )
                    else:
                        class_index = list(self.model_params[model_num].model_object.classes_).index(
                            np.array(self.tran_processed_label[model_num])[n - 1]
                        )
                    exp = Explanation(
                        self.tran_shap_values[model_num][class_index],
                        base_values=self.tran_shap_extra[model_num][:, class_index],
                        data=self.tran_processed_data.values,
                        feature_names=self.tran_processed_data.columns,
                    )
                else:
                    exp = Explanation(
                        self.tran_shap_values[model_num],
                        base_values=self.tran_shap_extra[model_num],
                        data=self.tran_processed_data.values,
                        feature_names=self.tran_processed_data.columns,
                    )

            else:
                exp = Explanation(
                    self.tran_shap_values[model_num],
                    base_values=self.tran_shap_extra[model_num],
                    data=self.tran_processed_data.values,
                    feature_names=self.tran_processed_data.columns,
                )

            # plotting the shap waterfall plot for the given index
            row_index = list(self.tran_processed_data.index).index(n - 1)

            # getting the values behind the waterfall plot
            plot_points = pd.DataFrame(
                {
                    "Feature_name": self.tran_processed_data.columns,
                    "Value": self.tran_processed_data.iloc[row_index],
                    "Shap": exp[row_index].values,
                }
            )
            plot_points = plot_points.sort_values(by="Shap", key=abs, ascending=False)
            efx = exp.base_values[row_index]
            fx = (exp.base_values[row_index]) + sum(exp[row_index].values)
            if self.tran_features == []:
                pl.figure(constrained_layout=True)
                shap.plots.waterfall(exp[row_index], max_display=self.tran_max_display, show=False)
                fig = pl.gcf()
                pl.ion()
                pl.close()
                im = self._plot_encode(fig, plot=None)

                other_features = pd.DataFrame(
                    {
                        "Feature_name": str(len(plot_points[self.tran_max_display - 1 :])) + " OTHER",
                        "Value": "",
                        "Shap": plot_points[self.tran_max_display - 1 :][["Shap"]].sum().values,
                    }
                )
                if plot_points.shape[0] == self.tran_max_display:
                    local_plot_points = plot_points[: self.tran_max_display]
                    feature_list = local_plot_points[["Feature_name", "Value", "Shap"]]
                else:
                    local_plot_points = plot_points[: self.tran_max_display - 1]
                    feature_list = pd.concat([local_plot_points, other_features])
                    feature_list = feature_list.replace("", None)

                dict_item = {
                    "id": n,
                    "efx": efx,
                    "fx": fx,
                    "plot_display": True,
                    "feature_info": feature_list[["Feature_name", "Value", "Shap"]].to_dict(orient="records"),
                }
                # generating dictionary of values for the indices passed
                self.tran_results["model_list"][model_num]["local_interpretability"].append(dict_item)
                self.tran_results["model_list"][model_num]["plot"]["local_plot"][n] = im
                self.tran_results["model_list"][model_num]["plot"]["class_index"][n] = class_index
            else:
                local = plot_points[np.isin(plot_points, self.tran_features).any(axis=1)]
                dict_item = {
                    "id": n,
                    "efx": efx,
                    "fx": fx,
                    "plot_display": False,
                    "feature_info": local[["Feature_name", "Value", "Shap"]].to_dict(orient="records"),
                }
                # generating dictionary of values for the indices passed
                self.tran_results["model_list"][model_num]["local_interpretability"].append(dict_item)
                self.tran_results["model_list"][model_num]["plot"]["local_plot"][n] = ""
                self.tran_results["model_list"][model_num]["plot"]["class_index"][n] = class_index

    def _compute_partial_dependence(self, model_num=0):
        """
        Creates partial dependence plots for 2 features as required.

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It saves the partial dependence plots in the results dictionary.
        """
        top_two = self.tran_top_features[model_num]["Feature_name"].tolist()[:2]
        tran_pdp_feature = self.tran_pdp_feature + top_two

        final_pdp = []
        [final_pdp.append(x) for x in tran_pdp_feature if x not in final_pdp]

        self.tran_pdp_feature_processed[model_num] = final_pdp[:2]

        if self.model_params[model_num].model_type != "regression":
            if (self.tran_pdp_target is None) and len(self.model_params[model_num].model_object.classes_) > 2:
                self.tran_pdp_target = self.model_params[model_num].pos_label[0]

        if getattr(self.model_params[model_num].model_object, "_estimator_type", None) not in [
            "classifier",
            "regressor",
        ]:
            if self.model_params[model_num].model_type == "regression":
                setattr(
                    self.model_params[model_num].model_object,
                    "_estimator_type",
                    "regressor",
                )
            else:
                setattr(
                    self.model_params[model_num].model_object,
                    "_estimator_type",
                    "classifier",
                )

        for i in self.tran_pdp_feature_processed[model_num]:
            if type(self.tran_shap_values[model_num]) == list:
                PartialDependenceDisplay.from_estimator(
                    self.model_params[model_num].model_object,
                    self.tran_processed_data,
                    [i],
                    target=self.tran_pdp_target,
                )
            else:
                PartialDependenceDisplay.from_estimator(
                    self.model_params[model_num].model_object,
                    self.tran_processed_data,
                    [i],
                )

            f = pl.gcf()
            pl.tight_layout()
            im, image_base_64 = self._plot_encode(f, plot="pdp_plot")
            pl.close()
            self.tran_results["model_list"][model_num]["plot"]["pdp_plot"][i] = im
            self.tran_results["model_list"][model_num]["partial_dependence_plot"][i] = image_base_64

        print("{:5s}{:35s}{:<10}".format("", "Partial dependence", "done"))

    def _compute_permutation_importance(self, model_num=0):
        """
        Computes permutation importance values by shuffling of the required features.

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It saves the permutation importance values in the results dictionary.
        """
        eval_pbar = tqdm(
            total=100,
            desc="Computing Permutation Importance",
            bar_format="{l_bar}{bar}",
        )
        eval_pbar.update(5)
        if self.perf_metric_obj is None:
            self.perf_metric_obj = PerformanceMetrics(self)

        if self.model_params[0].model_type in ["regression", "uplift"]:
            score_func = self.perf_metric_obj.map_perf_metric_to_method[self.perf_metric_name]
        else:
            score_func = self.perf_metric_obj.map_perf_metric_to_method_optimized[self.perf_metric_name]

        if self.evaluate_status == 1:
            base_score = self.perf_metric_obj.result["perf_metric_values"][self.perf_metric_name][0]
        else:
            if self.model_params[0].model_type == "regression":
                base_score = score_func(y_pred_new=[self.model_params[0].y_pred])
            elif self.model_params[0].model_type == "uplift":
                y_prob = [model.y_prob for model in self.model_params]
                base_score = score_func(y_prob_new=y_prob)
            else:
                base_score = score_func(
                    y_pred_new=[self.model_params[0].y_pred],
                    y_prob_new=[self.model_params[0].y_prob],
                )
        eval_pbar.update(5)

        permutation_additional = Constants().permutation_additional
        permutation_additional = min(
            int(self.tran_max_display * (1 + permutation_additional)),
            self.tran_input_features["shape"][1],
        )

        if self.tran_features == []:
            feature_list = self.tran_top_features[model_num]["Feature_name"].tolist()[:permutation_additional]
        else:
            feature_list = self.tran_features

        diff = []
        neg_flag = []
        new_list = list(set(feature_list) - set(self.permutation_importance["feature"]))

        for feature in new_list:
            original = self.model_params[0].x_test[feature].copy()
            transformed = np.array(original).copy()
            np.random.seed(0)
            np.random.shuffle(transformed)
            self.model_params[0].x_test[feature] = transformed
            if self.model_params[0].model_type == "regression":
                y_pred = self.model_params[0].model_object.predict(self.model_params[0].x_test)
                base_score_new = score_func(y_pred_new=[y_pred])
            elif self.model_params[0].model_type == "uplift":
                y_prob1 = self.model_params[0].model_object.predict_proba(self.model_params[0].x_test)
                y_prob2 = self.model_params[1].model_object.predict_proba(self.model_params[0].x_test)
                for i in range(y_prob1.shape[0]):
                    y_prob1[i] = y_prob1[i][::-1]
                    y_prob2[i] = y_prob2[i][::-1]
                y_prob = [y_prob1, y_prob2]
                base_score_new = score_func(y_prob_new=y_prob)
            else:
                y_pred = self.model_params[0].model_object.predict(self.model_params[0].x_test)
                y_prob = self.model_params[0].model_object.predict_proba(self.model_params[0].x_test)
                if y_prob.shape[1] > 2 or self.model_params[0].model_object.classes_[1] != 1:
                    if hasattr(self, "multiclass_flag") and not self.model_params[0].multi_class_flag:
                        y_pred, pos_label = self._check_label(
                            y_pred,
                            self.model_params[0].pos_label,
                            self.model_params[0].neg_label,
                            obj_in=self.model_params[0],
                            y_pred_flag=True,
                        )
                        y_prob = process_y_prob(
                            self.model_params[0].model_object.classes_,
                            y_prob,
                            self.model_params[0].pos_label,
                            self.model_params[0].neg_label,
                        )
                else:
                    y_prob = self.model_params[0].model_object.predict_proba(self.model_params[0].x_test)[:, 1]
                base_score_new = score_func(y_pred_new=[y_pred], y_prob_new=[y_prob])
            self.model_params[0].x_test[feature] = original
            diff.append(abs(base_score - base_score_new))
            if self.perf_metric_name in ["log_loss", "rmse", "mape", "wape"]:
                if base_score_new > base_score:
                    neg_flag.append(0)
                else:
                    neg_flag.append(1)
            else:
                if base_score > base_score_new:
                    neg_flag.append(0)
                else:
                    neg_flag.append(1)
            eval_pbar.update(80 / len(new_list))

        # Create a new DataFrame with the computed values
        new_data = pd.DataFrame({"feature": new_list, "diff": diff, "neg_flag": neg_flag})

        # Remove any columns that are all-NA from both DataFrames
        new_data = new_data.dropna(axis=1, how="all")
        self.permutation_importance = self.permutation_importance.dropna(axis=1, how="all")

        # Ensure both DataFrames have the same columns
        all_columns = list(set(new_data.columns) | set(self.permutation_importance.columns))
        new_data = new_data.reindex(columns=all_columns)
        self.permutation_importance = self.permutation_importance.reindex(columns=all_columns)

        # Fill NaN values with appropriate defaults
        new_data = new_data.fillna({"feature": "", "diff": 0, "neg_flag": False})
        self.permutation_importance = self.permutation_importance.fillna({"feature": "", "diff": 0, "neg_flag": False})

        # Concatenate the DataFrames
        self.permutation_importance = pd.concat([self.permutation_importance, new_data], ignore_index=True)
        self.permutation_importance = self.permutation_importance.sort_values(by="diff", ascending=False)
        perm_imp = self.permutation_importance.copy()
        perm_imp["score"] = perm_imp["diff"] / perm_imp["diff"].max() * 100
        perm_imp = perm_imp[: self.tran_max_display]
        neg_feature_list = list(perm_imp.loc[perm_imp["neg_flag"] == 1, "feature"])
        perm_imp["feature"] = perm_imp.apply(
            lambda row: (row["feature"] + "*" if row["neg_flag"] == 1 else row["feature"]),
            axis=1,
        )
        self.tran_results["permutation"]["score"] = perm_imp[["feature", "score"]].to_dict(orient="records")
        self.tran_results["permutation"]["title"] = "Permutation Importance Plot based on |Metric_old - Metric_new|"

        pl.figure(constrained_layout=True)
        pl.barh(y=perm_imp.feature, width=perm_imp.score, height=0.5)
        pl.gca().invert_yaxis()
        if len(neg_feature_list) > 0:
            if self.perf_metric_name in ["log_loss", "rmse", "mape", "wape"]:
                pl.xlabel("* indicates $Metric_{old} > Metric_{new}$", fontsize=8, loc="left")
                self.tran_results["permutation"]["footnote"] = "* indicates Metric_old > Metric_new"
            else:
                pl.xlabel("* indicates $Metric_{old} < Metric_{new}$", fontsize=8, loc="left")
                self.tran_results["permutation"]["footnote"] = "* indicates Metric_old < Metric_new"
        else:
            self.tran_results["permutation"]["footnote"] = None

        fig = pl.gcf()
        pl.close()
        im = self._plot_encode(fig, plot=None)
        self.tran_results["model_list"][0]["plot"]["perm_plot"] = im
        eval_pbar.set_description("Permutation Importance Calculated")
        eval_pbar.update(100 - eval_pbar.n)
        eval_pbar.close()

        print("{:5s}{:35s}{:<10}".format("", "Permutation importance", "done"))

    def _plot(
        self,
        model_num=0,
        interpretability_plot_flag=True,
        pdp_plot_flag=True,
        perm_imp_plot_flag=True,
    ):
        """
        Displays the plots in the console basis the flag values.

        Parameters
        ------------------
        model_num : int, default = 0
                It holds the model number for which analysis has to be done.

        interpretability_plot_flag : bool, default = True
                It determines whether local and global interpretability plots have to be displayed.

        pdp_plot_flag : bool, default = True
                It determines whether partial dependence plots have to be displayed.

        perm_imp_plot_flag : bool, default = True
                It determines whether permutation importance plot has to be displayed.

        Returns
        ----------
        This function does not return anything. It displays the plots in the console.
        """
        if interpretability_plot_flag is True:
            summary_plot = self.tran_results["model_list"][model_num]["plot"]["summary"]
            latest_local_key = list(self.tran_results["model_list"][model_num]["plot"]["local_plot"].keys())[-1]
            local_plot = self.tran_results["model_list"][model_num]["plot"]["local_plot"][latest_local_key]
            if type(summary_plot) != str:
                fig = pl.figure()
                fig.set_figheight((0.35 * self.tran_max_display) + 1)
                fig.set_figwidth(12)
                ax1 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
                ax1.imshow(summary_plot, aspect="auto")
                ax1.set_title("Global Interpretability Plot", fontsize=9, fontweight="bold")
                ax1.spines[["top", "right", "bottom", "left"]].set_visible(False)
                ax1.set_xticks([])
                ax1.set_yticks([])
                pl.tight_layout(pad=1.0)
                pl.show()

                fig = pl.figure()
                fig.set_figheight((self.tran_max_display * 0.4) + 1)
                fig.set_figwidth(12)
                ax2 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
                ax2.imshow(local_plot, aspect="auto")
                if self.tran_results["model_list"][model_num]["plot"]["class_index"][latest_local_key] != "NA":
                    label = self.model_params[model_num].model_object.classes_[
                        self.tran_results["model_list"][model_num]["plot"]["class_index"][latest_local_key]
                    ]
                    ax2.set_title(
                        "Local Interpretability Plot for index = "
                        + str(latest_local_key)
                        + ", target class: "
                        + str(label),
                        fontsize=9,
                        fontweight="bold",
                    )
                else:
                    ax2.set_title(
                        "Local Interpretability Plot for index = " + str(latest_local_key),
                        fontsize=9,
                        fontweight="bold",
                    )
                ax2.spines[["top", "right", "bottom", "left"]].set_visible(False)
                ax2.set_xticks([])
                ax2.set_yticks([])
                pl.tight_layout(pad=1.0)
                pl.show()
            else:
                summary_plot_datapoints = self.tran_results["model_list"][model_num]["summary_plot_data_table"]
                summary_plot_datapoints = pd.DataFrame(summary_plot_datapoints)
                local_plot_datapoints = self.tran_results["model_list"][model_num]["local_interpretability"][-1][
                    "feature_info"
                ]
                local_plot_datapoints = pd.DataFrame(local_plot_datapoints)
                efx = round(
                    self.tran_results["model_list"][model_num]["local_interpretability"][-1]["efx"],
                    3,
                )
                fx = round(
                    self.tran_results["model_list"][model_num]["local_interpretability"][-1]["fx"],
                    3,
                )
                ids = self.tran_results["model_list"][model_num]["local_interpretability"][-1]["id"]
                if self.tran_results["model_list"][model_num]["plot"]["class_index"][latest_local_key] != "NA":
                    label = self.model_params[model_num].model_object.classes_[
                        self.tran_results["model_list"][model_num]["plot"]["class_index"][latest_local_key]
                    ]
                    local_title = (
                        "Local interpretability for index: "
                        + str(ids)
                        + ", target class: "
                        + str(label)
                        + "\\nefx: "
                        + str(efx)
                        + ", fx: "
                        + str(fx)
                    )
                else:
                    local_title = (
                        "Local interpretability for index: " + str(ids) + "\\nefx: " + str(efx) + ", fx: " + str(fx)
                    )
                styles = [
                    dict(
                        selector="caption",
                        props=[
                            ("text-align", "center"),
                            ("font-size", "12"),
                            ("font-weight", "950"),
                            ("color", "black"),
                        ],
                    )
                ]
                summary_plot_datapoints = (
                    summary_plot_datapoints.style.set_table_attributes("style='display:inline'")
                    .set_caption("Global interpretability values")
                    .set_table_styles(styles)
                )
                local_plot_datapoints = (
                    local_plot_datapoints.style.set_table_attributes("style='display:inline'")
                    .set_caption(local_title)
                    .set_table_styles(styles)
                )
                display_html(summary_plot_datapoints._repr_html_(), raw=True)
                display_html(local_plot_datapoints._repr_html_().replace("\\n", "<br>"), raw=True)

        if pdp_plot_flag is True:
            pdp_plot1 = self.tran_results["model_list"][model_num]["plot"]["pdp_plot"][
                self.tran_pdp_feature_processed[model_num][0]
            ]
            pdp_plot2 = self.tran_results["model_list"][model_num]["plot"]["pdp_plot"][
                self.tran_pdp_feature_processed[model_num][1]
            ]
            fig = pl.figure()
            fig.set_figheight(9)
            fig.set_figwidth(12)
            ax3 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
            ax4 = pl.subplot2grid(shape=(1, 2), loc=(0, 1), colspan=1)
            ax3.imshow(pdp_plot1)
            ax4.imshow(pdp_plot2)
            if (self.model_params[0].model_type != "regression") and (
                len(self.model_params[model_num].model_object.classes_) > 2
            ):
                ax3.set_title(
                    "Partial Dependence Plot for "
                    + str(self.tran_pdp_feature_processed[model_num][0])
                    + "(class "
                    + str(self.tran_pdp_target)
                    + ")",
                    fontsize=9,
                    fontweight="bold",
                )
                ax4.set_title(
                    "Partial Dependence Plot for "
                    + str(self.tran_pdp_feature_processed[model_num][1])
                    + "(class "
                    + str(self.tran_pdp_target)
                    + ")",
                    fontsize=9,
                    fontweight="bold",
                )
            else:
                ax3.set_title(
                    "Partial Dependence Plot for " + str(self.tran_pdp_feature_processed[model_num][0]),
                    fontsize=9,
                    fontweight="bold",
                )
                ax4.set_title(
                    "Partial Dependence Plot for " + str(self.tran_pdp_feature_processed[model_num][1]),
                    fontsize=9,
                    fontweight="bold",
                )
            for i in [ax3, ax4]:
                i.spines[["top", "right", "bottom", "left"]].set_visible(False)
                i.set_xticks([])
                i.set_yticks([])
            pl.tight_layout(pad=0.7)
            pl.show()

        if perm_imp_plot_flag is True:
            perm_plot = self.tran_results["model_list"][0]["plot"]["perm_plot"]
            fig = pl.figure()
            fig.set_figheight((1 * self.tran_max_display) + 1)
            fig.set_figwidth(15)
            ax5 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
            ax5.imshow(perm_plot)
            ax5.set_title(
                "Permutation Importance Plot based on $\mathbf{|Metric_{old} - Metric_{new}|}$",
                fontsize=9,
                fontweight="bold",
            )
            ax5.spines[["top", "right", "bottom", "left"]].set_visible(False)
            ax5.set_xticks([])
            ax5.set_yticks([])
            pl.show()

    def _data_prep(self, model_num=0):
        """
        Prepares the data for analysis by executing _data_sampling, _shap and _top_features functions.
        Updates the tran_features with additional features, if required.

        Parameters
        ----------
        model_num : int, default=None
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It prepares the data for analysis.
        """
        if self.tran_flag["data_sampling_flag"] is False:
            self._data_sampling()
            self.tran_flag["data_sampling_flag"] = True
        self._shap(model_num=model_num)
        self._top_features(model_num=model_num)
        self.tran_features = list(set(self.tran_features))
        if self.tran_features != [] and len(self.tran_features) < self.tran_max_display:
            for j in self.tran_top_features[model_num]["Feature_name"].tolist():
                if j not in self.tran_features:
                    self.tran_features.append(j)
                if len(self.tran_features) == self.tran_max_display:
                    break

        self.tran_flag[model_num]["data_prep_flag"] = True

    def explain(self, disable=[], local_row_num=None, output=True, model_num=None):
        """
        Computes the output for the entire transparency analysis basis the inputs given by the user.

        Parameters
        ----------
        disable : list, default = None
                It gives a list of analysis that the user can skip.
                Accepted values: ['interpret','partial_dep','perm_imp']

        local_row_num : int, default = None
                It stores the value of the index required to calculate local interpretability.
                (local_row_num refers to row number mapping from the x_train data set and the input starts from 1.)

        output : boolean, default = True
                If output is true, required transparency plots will be shown to the user on the console.

        model_num : int, default = None
                It holds the model number for which analysis has to be done.

        Returns
        ----------
        This function does not return anything. It will print the charts and generates the results dictionary as per the user input.
        """
        if self.model_params[0].model_object is None:
            print(
                "Skipped: All transparency analysis skipped due to insufficient data input during ModelContainer() initialization."
            )
            return

        if self.tran_input_features["check_input_flag"] == 2:
            print(
                "Skipped: All transparency analysis skipped due to insufficient data input during ModelContainer() initialization."
            )
            return

        if disable is not None:
            if ("perm_imp" not in disable) and (
                (self.model_params[0].y_true is None) or (self.model_params[0].x_test is None)
            ):
                print(
                    "Skipped: Permutation importance skipped due to insufficient data input during ModelContainer() initialization."
                )
                disable.append("perm_imp")
            if self.model_params[0].model_type != "regression":
                if ("partial_dep" not in disable) and (
                    (self.tran_pdp_target is None)
                    and len(self.model_params[0].model_object.classes_) > 2
                    and (self.model_params[0].pos_label is None)
                ):
                    print(
                        "Skipped: Partial dependence skipped due to insufficient data input during ModelContainer() initialization."
                    )
                    disable.append("partial_dep")

        valid_input = ["interpret", "partial_dep", "perm_imp"]
        valid_disable = []
        if disable is not None:
            if type(disable) != list:
                self.err.push(
                    "type_error",
                    var_name="disable",
                    given=type(disable),
                    expected="list",
                    function_name="explain",
                )
                self.err.pop()
            else:
                for i in disable:
                    if i in valid_input:
                        valid_disable.append(i)

        disable_flags = {}
        for i in valid_input:
            disable_flags[i] = False
        if disable is not None:
            for i in valid_disable:
                disable_flags[i] = True

        if model_num is None:
            model_num = len(self.model_params) - 1
        elif type(model_num) != int:
            self.err.push(
                "type_error",
                var_name="model_num",
                given=type(model_num),
                expected="int",
                function_name="explain",
            )
            self.err.pop()
        elif model_num not in range(1, len(self.model_params) + 1):
            self.err.push(
                "value_error",
                var_name="model_num",
                given=model_num,
                expected="one of the following integers: " + str(list(range(len(self.model_params) + 1))[1:]),
                function_name="explain",
            )
            self.err.pop()
        else:
            model_num = model_num - 1

        if type(local_row_num) in [int, float]:
            local_row_num = int(local_row_num)
            if local_row_num < 1 or local_row_num > self.tran_input_features["shape"][0]:
                self.err.push(
                    "value_error",
                    var_name="local_row_num",
                    given=local_row_num,
                    expected="An integer value within the index range 1-" + str(self.tran_input_features["shape"][0]),
                    function_name="explain",
                )
                self.err.pop()
        elif local_row_num is not None:
            self.err.push(
                "type_error",
                var_name="local_row_num",
                given=type(local_row_num),
                expected="An integer value within the index range 1-" + str(self.tran_input_features["shape"][0]),
                function_name="explain",
            )
            self.err.pop()

        if (disable is not None) and (len(disable) > 0) and (local_row_num is not None):
            print(
                "Warning: The local interpretability plot is shown basis the given index and input for disable is ignored."
            )

        if local_row_num is None:
            # all disable flags are true
            if len(list(set(valid_input) - set(valid_disable))) == 0:
                print(
                    "{:40s}{:<10}".format(
                        "Transparency analysis for model " + str(model_num + 1),
                        "skipped",
                    )
                )
            else:
                print("{:40s}{:<10}".format("Running transparency for model " + str(model_num + 1), "done"))
                if self.tran_flag[model_num]["data_prep_flag"] is False:
                    self._data_prep(model_num=model_num)
                    print("{:5s}{:35s}{:<10}".format("", "Data preparation", "done"))
                if disable_flags["interpret"] is False:
                    if self.tran_flag[model_num]["interpret"] is False:
                        self._global(model_num=model_num)
                        for idx in self.tran_row_num:
                            self._local(n=idx, model_num=model_num)
                            self.tran_flag[model_num]["interpret"] = True
                        print("{:5s}{:35s}{:<10}".format("", "Interpretability", "done"))
                else:
                    print("{:5s}{:35s}{:<10}".format("", "Interpretability", "skipped"))

                if disable_flags["partial_dep"] is False:
                    if self.tran_flag[model_num]["partial_dep"] is False:
                        self._compute_partial_dependence(model_num=model_num)
                        self.tran_flag[model_num]["partial_dep"] = True
                else:
                    print("{:5s}{:35s}{:<10}".format("", "Partial dependence", "skipped"))

                if disable_flags["perm_imp"] is False:
                    if self.tran_flag[model_num]["perm_imp"] is False:
                        self._compute_permutation_importance(model_num=model_num)
                        self.tran_flag[model_num]["perm_imp"] = True
                else:
                    print("{:5s}{:35s}{:<10}".format("", "Permutation importance", "skipped"))

                if output is True:
                    self._plot(
                        model_num=model_num,
                        interpretability_plot_flag=not disable_flags["interpret"],
                        pdp_plot_flag=not disable_flags["partial_dep"],
                        perm_imp_plot_flag=not disable_flags["perm_imp"],
                    )

        else:
            if self.tran_flag[model_num]["interpret"] is False:
                if self.tran_flag[model_num]["data_prep_flag"] is False:
                    self.tran_row_num.append(local_row_num)
                    self._data_prep(model_num=model_num)
                    print("{:5s}{:35s}{:<10}".format("", "Data preparation", "done"))
                elif local_row_num - 1 in self.tran_processed_data.index:
                    self.tran_row_num.append(local_row_num)
                else:
                    print(
                        "Warning: Given value of local_row_num not found in the processed dataset. Please re-initiliaze the use case object with tran_row_num as required or try with following indices:"
                    )
                    print((np.sort(np.array(self.tran_processed_data.index)))[:10] + 1)
                    return
                self._global(model_num=model_num)
                for idx in self.tran_row_num:
                    self._local(n=idx, model_num=model_num)
                print("{:5s}{:35s}{:<10}".format("", "Interpretability", "done"))
                local_plot = self.tran_results["model_list"][model_num]["plot"]["local_plot"][local_row_num]
                if type(local_plot) != str:
                    fig = pl.figure()
                    fig.set_figheight((self.tran_max_display * 0.4) + 1)
                    fig.set_figwidth(12)
                    ax1 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
                    ax1.imshow(local_plot, aspect="auto")
                    if self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num] != "NA":
                        label = self.model_params[model_num].model_object.classes_[
                            self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num]
                        ]
                        ax1.set_title(
                            "Local plot for Model "
                            + str(model_num + 1)
                            + " for index = "
                            + str(local_row_num)
                            + ", target class: "
                            + str(label),
                            fontsize=9,
                            fontweight="bold",
                        )
                    else:
                        ax1.set_title(
                            "Local plot for Model " + str(model_num + 1) + " for index = " + str(local_row_num),
                            fontsize=9,
                            fontweight="bold",
                        )
                    ax1.spines[["top", "right", "bottom", "left"]].set_visible(False)
                    ax1.set_xticks([])
                    ax1.set_yticks([])
                    pl.show()
                else:
                    local_plot_datapoints = self.tran_results["model_list"][model_num]["local_interpretability"][-1][
                        "feature_info"
                    ]
                    local_plot_datapoints = pd.DataFrame(local_plot_datapoints)
                    efx = round(
                        self.tran_results["model_list"][model_num]["local_interpretability"][-1]["efx"],
                        3,
                    )
                    fx = round(
                        self.tran_results["model_list"][model_num]["local_interpretability"][-1]["fx"],
                        3,
                    )
                    ids = self.tran_results["model_list"][model_num]["local_interpretability"][-1]["id"]
                    if self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num] != "NA":
                        label = self.model_params[model_num].model_object.classes_[
                            self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num]
                        ]
                        local = (
                            "Local interpretability for index: "
                            + str(ids)
                            + ", target class: "
                            + str(label)
                            + "\\n[efx: "
                            + str(efx)
                            + ", fx: "
                            + str(fx)
                            + "]"
                        )
                    else:
                        local = (
                            "Local interpretability for index: "
                            + str(ids)
                            + "\\n[efx: "
                            + str(efx)
                            + ", fx: "
                            + str(fx)
                            + "]"
                        )
                    styles = [
                        dict(
                            selector="caption",
                            props=[
                                ("text-align", "center"),
                                ("font-size", "12"),
                                ("font-weight", "950"),
                                ("color", "black"),
                            ],
                        )
                    ]
                    local_plot_datapoints = (
                        local_plot_datapoints.style.set_table_attributes("style='display:inline'")
                        .set_caption(local)
                        .set_table_styles(styles)
                    )
                    display_html(
                        local_plot_datapoints._repr_html_().replace("\\n", "<br>"),
                        raw=True,
                    )
                self.tran_flag[model_num]["interpret"] = True

            else:
                if local_row_num - 1 in self.tran_processed_data.index:
                    self._local(n=local_row_num, model_num=model_num)
                    local_plot = self.tran_results["model_list"][model_num]["plot"]["local_plot"][local_row_num]
                    if type(local_plot) != str:
                        fig = pl.figure()
                        fig.set_figheight((self.tran_max_display * 0.4) + 1)
                        fig.set_figwidth(12)
                        ax1 = pl.subplot2grid(shape=(1, 2), loc=(0, 0), colspan=1)
                        ax1.imshow(local_plot, aspect="auto")
                        if self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num] != "NA":
                            label = self.model_params[model_num].model_object.classes_[
                                self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num]
                            ]
                            ax1.set_title(
                                "Local plot for Model "
                                + str(model_num + 1)
                                + " for index = "
                                + str(local_row_num)
                                + ", target class: "
                                + str(label),
                                fontsize=9,
                                fontweight="bold",
                            )
                        else:
                            ax1.set_title(
                                "Local plot for Model " + str(model_num + 1) + " for index = " + str(local_row_num),
                                fontsize=9,
                                fontweight="bold",
                            )
                        ax1.spines[["top", "right", "bottom", "left"]].set_visible(False)
                        ax1.set_xticks([])
                        ax1.set_yticks([])
                        pl.show()
                    else:
                        local_plot_datapoints = self.tran_results["model_list"][model_num]["local_interpretability"][
                            -1
                        ]["feature_info"]
                        local_plot_datapoints = pd.DataFrame(local_plot_datapoints)
                        efx = round(
                            self.tran_results["model_list"][model_num]["local_interpretability"][-1]["efx"],
                            3,
                        )
                        fx = round(
                            self.tran_results["model_list"][model_num]["local_interpretability"][-1]["fx"],
                            3,
                        )
                        ids = self.tran_results["model_list"][model_num]["local_interpretability"][-1]["id"]
                        if self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num] != "NA":
                            label = self.model_params[model_num].model_object.classes_[
                                self.tran_results["model_list"][model_num]["plot"]["class_index"][local_row_num]
                            ]
                            local = (
                                "Local interpretability for index: "
                                + str(ids)
                                + ", target class: "
                                + str(label)
                                + "\\n[efx: "
                                + str(efx)
                                + ", fx: "
                                + str(fx)
                                + "]"
                            )
                        else:
                            local = (
                                "Local interpretability for index: "
                                + str(ids)
                                + "\\n[efx: "
                                + str(efx)
                                + ", fx: "
                                + str(fx)
                                + "]"
                            )
                        styles = [
                            dict(
                                selector="caption",
                                props=[
                                    ("text-align", "center"),
                                    ("font-size", "12"),
                                    ("font-weight", "950"),
                                    ("color", "black"),
                                ],
                            )
                        ]
                        local_plot_datapoints = (
                            local_plot_datapoints.style.set_table_attributes("style='display:inline'")
                            .set_caption(local)
                            .set_table_styles(styles)
                        )
                        display_html(
                            local_plot_datapoints._repr_html_().replace("\\n", "<br>"),
                            raw=True,
                        )
                else:
                    print(
                        "Warning: Given value of local_row_num not found in the processed dataset. Please re-initiliaze the use case object with tran_row_num as required or try with following indices:"
                    )
                    print((np.sort(np.array(self.tran_processed_data.index)))[:10] + 1)

    def _tran_compile(self, disable=[]):
        """
        Ensures tran results dictionary is udpated with all the results for all the models based on the user input.

        Parameters
        ----------
        disable : list, default = []
                It gives a list of analysis that the user can skip.
                Accepted values: ['interpret','partial_dep','perm_imp']

        Returns
        ----------
        This function returns the transparency results to be included in the json file.
        """

        if (self.model_params[0].y_true is None) or (self.model_params[0].x_test is None):
            disable.append("perm_imp")
        if self.model_params[0].model_object is None:
            print("{:40s}{:<10}".format("Transparency analysis ", "skipped"))
            return None
        if self.tran_input_features["check_input_flag"] == 2:
            print("{:40s}{:<10}".format("Transparency analysis ", "skipped"))
            return None
        if (self.model_params[0].model_type != "regression") and (self.model_params[0].model_object is not None):
            if (
                (self.tran_pdp_target is None)
                and len(self.model_params[0].model_object.classes_) > 2
                and (self.model_params[0].pos_label is None)
            ):
                disable.append("partial_dep")

        for i in range(len(self.model_params)):
            self.explain(disable=disable, model_num=i + 1, output=False)
        tran_results = copy.deepcopy(self.tran_results)

        if len(list(set({"interpret", "partial_dep", "perm_imp"}) - set(disable))) == 0:
            tran_results = None
        else:
            if tran_results["permutation"]["score"] == "":
                tran_results["permutation"] = None
            for i in range(len(self.model_params)):
                del tran_results["model_list"][i]["plot"]
                if (len(tran_results["model_list"][i]["local_interpretability"])) == 0:
                    tran_results["model_list"][i]["local_interpretability"] = None
                if (tran_results["model_list"][i]["partial_dependence_plot"]) == {}:
                    tran_results["model_list"][i]["partial_dependence_plot"] = None
                if (tran_results["model_list"][i]["summary_plot"]) == "":
                    tran_results["model_list"][i]["summary_plot"] = None
                if (tran_results["model_list"][i]["summary_plot_data_table"]) == "":
                    tran_results["model_list"][i]["summary_plot_data_table"] = None
        return tran_results
