import warnings
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import re


# def waterfall(base_values, loc, values, features, feature_names,max_display=10, show=True):
def waterfall(base_values, loc, shap_values, feature_values, feature_names, filename, max_display=10, show=True):
    """Plots an explantion of a single prediction as a waterfall plot.
    The SHAP value of a feature represents the impact of the evidence provided by that feature on the model's
    output. The waterfall plot is designed to visually display how the SHAP values (evidence) of each feature
    move the model output from our prior expectation under the background data distribution, to the final model
    prediction given the evidence of all the features. Features are sorted by the magnitude of their SHAP values
    with the smallest magnitude features grouped together at the bottom of the plot when the number of features
    in the models exceeds the max_display parameter.
    Parameters
    ----------
    base_values : float
        Expected base value
    loc : float
        Actual value
    shap_values : ndarray
        SHAP values of the features
    feature_values : ndarray
        Actual values of the features
    feature_names : ndarray
        Feature names to plot
    max_display : int
        The maximum number of features to plot.
    show : bool
        Whether matplotlib.pyplot.show() is called before returning. Setting this to False allows the plot
        to be customized further after it has been created.
    """
    orig_interactive_mode = plt.isinteractive()

    try:
        # Input validation
        # Check base_values is scalar
        if isinstance(base_values, (list, np.ndarray)) and len(base_values) > 0:
            raise ValueError(
                "waterfall_plot requires a scalar base_values of the model output as the first "
                "parameter, but you have passed an array as the first parameter!"
            )

        # Check shap_values is not empty and is 1D
        if not isinstance(shap_values, np.ndarray):
            shap_values = np.array(shap_values)

        if len(shap_values) == 0:
            raise ValueError("shap_values cannot be empty")

        if len(shap_values.shape) > 1:
            raise ValueError(
                "The waterfall_plot can currently only plot a single explanation but a matrix of explanations was passed!"
            )

        # Ensure feature_names is provided and has correct length
        if feature_names is None:
            feature_names = np.array([f"Feature {i}" for i in range(len(shap_values))])
        elif len(feature_names) != len(shap_values):
            raise ValueError(
                f"Length of feature_names ({len(feature_names)}) must match length of shap_values ({len(shap_values)})"
            )

        # Check feature_values if provided
        if feature_values is not None and len(feature_values) != len(shap_values):
            raise ValueError(
                f"Length of feature_values ({len(feature_values)}) must match length of shap_values ({len(shap_values)})"
            )

        # Check for NaN and Inf values in shap_values
        if not np.all(np.isfinite(shap_values)):
            warnings.warn("shap_values contains NaN or Inf values. These will be replaced with zeros.")
            shap_values = np.nan_to_num(shap_values)

        # init variables we use for tracking the plot locations
        num_features = min(max_display, len(shap_values))
        row_height = 0.5

        # Check that we have at least one feature to display
        if num_features <= 0:
            raise ValueError("No features to display. Check max_display and length of shap_values.")

        # Create a new figure to avoid drawing on existing plots
        plt.figure(figsize=(8, num_features * row_height + 1.5))

        # Turn off interactive plot if show is False
        if show is False:
            plt.ioff()

        # see how many individual (vs. grouped at the end) features we are plotting
        if num_features == len(shap_values):
            num_individual = num_features
        else:
            num_individual = num_features - 1

        rng = range(num_features - 1, -1, -1)

        # Sort shap_values by magnitude
        order = np.argsort(-np.abs(shap_values))

        pos_lefts = []
        pos_inds = []
        pos_widths = []
        neg_lefts = []
        neg_inds = []
        neg_widths = []

        running_loc = loc  # Use the provided loc as the starting point
        yticklabels = ["" for _ in range(num_features + 1)]

        # compute the locations of the individual features and plot the dashed connecting lines
        for i in range(num_individual):
            sval = shap_values[order[i]]
            # Handle potential NaN or Inf in individual shap values
            if not np.isfinite(sval):
                sval = 0

            running_loc -= sval

            if sval >= 0:
                pos_inds.append(rng[i])
                pos_widths.append(sval)
                pos_lefts.append(running_loc)
            else:
                neg_inds.append(rng[i])
                neg_widths.append(sval)
                neg_lefts.append(running_loc)

            # Draw connecting lines
            if i + 4 < num_individual:
                plt.plot(
                    [running_loc, running_loc],
                    [rng[i] - 1 - 0.4, rng[i] + 0.4],
                    color="#bbbbbb",
                    linestyle="--",
                    linewidth=0.5,
                    zorder=-1,
                )

            # Process feature values and names for labels
            if feature_values is None:
                yticklabels[rng[i]] = feature_names[order[i]]
            else:
                v = feature_values[order[i]]
                if isinstance(v, (int, float)) and np.isnan(v):
                    yticklabels[rng[i]] = feature_names[order[i]]
                elif np.issubdtype(type(v), np.number):
                    yticklabels[rng[i]] = format_value(float(v), "%0.3f") + " = " + feature_names[order[i]]
                else:
                    yticklabels[rng[i]] = str(v) + " = " + feature_names[order[i]]

        # add a last grouped feature to represent the impact of all the features we didn't show
        if num_features < len(shap_values):
            remaining_impact = base_values - running_loc
            yticklabels[0] = "%d other features" % (len(shap_values) - num_features + 1)

            if remaining_impact < 0:
                pos_inds.append(0)
                pos_widths.append(-remaining_impact)
                pos_lefts.append(running_loc + remaining_impact)
            else:
                neg_inds.append(0)
                neg_widths.append(-remaining_impact)
                neg_lefts.append(running_loc + remaining_impact)

        # Ensure there's at least some data to plot
        if not pos_inds and not neg_inds:
            warnings.warn("No positive or negative effects to plot")
            plt.close()
            return None

        # Calculate plot boundaries
        all_points = (
            pos_lefts
            + list(np.array(pos_lefts) + np.array(pos_widths))
            + neg_lefts
            + list(np.array(neg_lefts) + np.array(neg_widths))
        )

        # Avoid division by zero with empty points list
        if all_points:
            dataw = max(np.max(all_points) - np.min(all_points), 1e-8)
        else:
            dataw = 1.0

        # draw invisible bars just for sizing the axes
        label_padding = np.array([0.1 * dataw if w < 1 else 0 for w in pos_widths])
        plt.barh(
            pos_inds,
            np.array(pos_widths) + label_padding + 0.02 * dataw,
            left=np.array(pos_lefts) - 0.01 * dataw,
            color="#FF0051",
            alpha=0,
        )

        label_padding = np.array([-0.1 * dataw if -w < 1 else 0 for w in neg_widths])
        plt.barh(
            neg_inds,
            np.array(neg_widths) + label_padding - 0.02 * dataw,
            left=np.array(neg_lefts) + 0.01 * dataw,
            color="#008BFB",
            alpha=0,
        )

        # define variables we need for plotting the arrows
        head_length = 0.08
        bar_width = 0.8

        # Get current axis and figure
        ax = plt.gca()
        fig = plt.gcf()

        # Get plot dimensions for scaling
        bbox = ax.get_window_extent().transformed(fig.dpi_scale_trans.inverted())
        width, height = bbox.width, bbox.height

        # Avoid division by zero
        bbox_to_xscale = dataw / max(width, 1e-8)
        hl_scaled = bbox_to_xscale * head_length

        # Get x limits
        xmin, xmax = ax.get_xlim()

        # Get renderer - if this fails, use simpler text placement
        try:
            renderer = fig.canvas.get_renderer()
            use_renderer = True
        except:
            use_renderer = False
            renderer = None

        # draw the positive arrows
        for i in range(len(pos_inds)):
            dist = pos_widths[i]
            if dist < 1e-8:  # Skip very small arrows
                continue

            arrow_obj = plt.arrow(
                pos_lefts[i],
                pos_inds[i],
                max(dist - hl_scaled, 0.000001),
                0,
                head_length=min(dist, hl_scaled),
                color="#FF0051",
                width=bar_width,
                head_width=bar_width,
            )

            # Place text on the arrow
            txt_obj = plt.text(
                pos_lefts[i] + 0.5 * dist,
                pos_inds[i],
                format_value(pos_widths[i], "%+0.02f"),
                horizontalalignment="center",
                verticalalignment="center",
                color="white",
                fontsize=12,
            )

            # If renderer is available, check if text fits on arrow
            if use_renderer:
                text_bbox = txt_obj.get_window_extent(renderer=renderer)
                arrow_bbox = arrow_obj.get_window_extent(renderer=renderer)

                # if the text overflows the arrow then draw it after the arrow
                if text_bbox.width > arrow_bbox.width:
                    txt_obj.remove()

                    plt.text(
                        pos_lefts[i] + (5 / 72) * bbox_to_xscale + dist,
                        pos_inds[i],
                        format_value(pos_widths[i], "%+0.02f"),
                        horizontalalignment="left",
                        verticalalignment="center",
                        color="#FF0051",
                        fontsize=12,
                    )

        # draw the negative arrows
        for i in range(len(neg_inds)):
            dist = neg_widths[i]
            if np.abs(dist) < 1e-8:  # Skip very small arrows
                continue

            arrow_obj = plt.arrow(
                neg_lefts[i],
                neg_inds[i],
                -max(-dist - hl_scaled, 0.000001),
                0,
                head_length=min(-dist, hl_scaled),
                color="#008BFB",
                width=bar_width,
                head_width=bar_width,
            )

            # Place text on the arrow
            txt_obj = plt.text(
                neg_lefts[i] + 0.5 * dist,
                neg_inds[i],
                format_value(neg_widths[i], "%+0.02f"),
                horizontalalignment="center",
                verticalalignment="center",
                color="white",
                fontsize=12,
            )

            # If renderer is available, check if text fits on arrow
            if use_renderer:
                text_bbox = txt_obj.get_window_extent(renderer=renderer)
                arrow_bbox = arrow_obj.get_window_extent(renderer=renderer)

                # if the text overflows the arrow then draw it after the arrow
                if text_bbox.width > arrow_bbox.width:
                    txt_obj.remove()

                    plt.text(
                        neg_lefts[i] - (5 / 72) * bbox_to_xscale + dist,
                        neg_inds[i],
                        format_value(neg_widths[i], "%+0.02f"),
                        horizontalalignment="right",
                        verticalalignment="center",
                        color="#008BFB",
                        fontsize=12,
                    )

        # draw the y-ticks twice, once in gray and then again with just the feature names in black
        # The 1e-8 is so matplotlib 3.3 doesn't try and collapse the ticks
        ytick_pos = list(range(num_features)) + list(np.arange(num_features) + 1e-8)

        # Prepare ytick labels properly
        ytick_labels = yticklabels[:-1]
        ytick_labels_split = []

        for label in ytick_labels:
            parts = label.split("=")
            if len(parts) > 1:
                ytick_labels_split.append(parts[-1].strip())
            else:
                ytick_labels_split.append(parts[0].strip())

        plt.yticks(ytick_pos, ytick_labels + ytick_labels_split, fontsize=13)

        # put horizontal lines for each feature row
        for i in range(num_features):
            plt.axhline(i, color="#cccccc", lw=0.5, dashes=(1, 5), zorder=-1)

        # mark the prior expected value and the model prediction
        plt.axvline(base_values, 0, 1 / num_features, color="#bbbbbb", linestyle="--", linewidth=0.5, zorder=-1)
        fx = base_values + np.sum(shap_values)
        plt.axvline(fx, 0, 1, color="#bbbbbb", linestyle="--", linewidth=0.5, zorder=-1)

        # clean up the main axis
        ax.xaxis.set_ticks_position("bottom")
        ax.yaxis.set_ticks_position("none")
        ax.spines["right"].set_visible(False)
        ax.spines["top"].set_visible(False)
        ax.spines["left"].set_visible(False)
        ax.tick_params(labelsize=13)

        # draw the E[f(X)] tick mark
        ax2 = ax.twiny()
        ax2.set_xlim(xmin, xmax)
        ax2.set_xticks([base_values, base_values + 1e-8])
        ax2.set_xticklabels(
            ["\n$E[f(X)]$", "\n$ = " + format_value(base_values, "%0.03f") + "$"], fontsize=12, ha="left"
        )
        ax2.spines["right"].set_visible(False)
        ax2.spines["top"].set_visible(False)
        ax2.spines["left"].set_visible(False)

        # draw the f(x) tick mark
        ax3 = ax2.twiny()
        ax3.set_xlim(xmin, xmax)
        ax3.set_xticks([fx, fx + 1e-8])
        ax3.set_xticklabels(["$f(x)$", "$ = " + format_value(fx, "%0.03f") + "$"], fontsize=12, ha="left")

        # adjust tick label positions
        tick_labels = ax3.xaxis.get_majorticklabels()
        tick_labels[0].set_transform(
            tick_labels[0].get_transform() + matplotlib.transforms.ScaledTranslation(-10 / 72.0, 0, fig.dpi_scale_trans)
        )
        tick_labels[1].set_transform(
            tick_labels[1].get_transform() + matplotlib.transforms.ScaledTranslation(12 / 72.0, 0, fig.dpi_scale_trans)
        )
        tick_labels[1].set_color("#999999")

        ax3.spines["right"].set_visible(False)
        ax3.spines["top"].set_visible(False)
        ax3.spines["left"].set_visible(False)

        # adjust the position of the E[f(X)] = x.xx label
        tick_labels = ax2.xaxis.get_majorticklabels()
        tick_labels[0].set_transform(
            tick_labels[0].get_transform() + matplotlib.transforms.ScaledTranslation(-20 / 72.0, 0, fig.dpi_scale_trans)
        )
        tick_labels[1].set_transform(
            tick_labels[1].get_transform()
            + matplotlib.transforms.ScaledTranslation(22 / 72.0, -1 / 72.0, fig.dpi_scale_trans)
        )
        tick_labels[1].set_color("#999999")

        # color the y tick labels that have the feature values as gray
        tick_labels = ax.yaxis.get_majorticklabels()
        for i in range(num_features):
            tick_labels[i].set_color("#999999")

        # Final adjustments and save/show
        if show:
            plt.tight_layout()
            plt.show()
        else:
            # Avoid division by zero
            safe_len = max(1, len(shap_values))
            plt.subplots_adjust(left=0.3, bottom=1 / safe_len, right=0.9, top=1 - 1 / safe_len)
            plt.savefig(filename, bbox_inches="tight")
            plt.close()
            return filename

    except Exception as e:
        warnings.warn(f"Error in waterfall plot: {str(e)}")
        plt.close()
        return None

    finally:
        # Restore original interactive state
        if orig_interactive_mode:
            plt.ion()
        else:
            plt.ioff()


def format_value(s, format_str):
    """Strips trailing zeros and uses a unicode minus sign."""

    if not issubclass(type(s), str):
        s = format_str % s
    s = re.sub(r"\.?0+$", "", s)
    if s[0] == "-":
        s = "\u2212" + s[1:]
    return s
