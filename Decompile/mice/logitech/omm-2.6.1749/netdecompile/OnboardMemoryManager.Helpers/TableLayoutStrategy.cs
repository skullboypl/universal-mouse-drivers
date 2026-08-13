using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;

namespace OnboardMemoryManager.Helpers;

public class TableLayoutStrategy : ILayoutStrategy
{
	private int _columnCount;

	private double[] _colWidths;

	private readonly List<double> _rowHeights = new List<double>();

	private int _elementCount;

	public Size ResultSize
	{
		get
		{
			if (_colWidths == null || !_rowHeights.Any())
			{
				return new Size(0.0, 0.0);
			}
			return new Size(_colWidths.Sum(), _rowHeights.Sum());
		}
	}

	public void Calculate(Size availableSize, Size[] measures)
	{
		BaseCalculation(availableSize, measures);
		AdjustEmptySpace(availableSize);
	}

	private void BaseCalculation(Size availableSize, Size[] measures)
	{
		_elementCount = measures.Length;
		_columnCount = GetColumnCount(availableSize, measures);
		if (_colWidths == null || _colWidths.Length < _columnCount)
		{
			_colWidths = new double[_columnCount];
		}
		bool flag = true;
		while (flag)
		{
			flag = false;
			ResetSizes();
			for (int i = 0; i * _columnCount < measures.Length; i++)
			{
				double num = 0.0;
				for (int j = 0; j < _columnCount; j++)
				{
					int num2 = i * _columnCount + j;
					if (num2 >= measures.Length)
					{
						break;
					}
					_colWidths[j] = Math.Max(_colWidths[j], measures[num2].Width);
					num = Math.Max(num, measures[num2].Height);
				}
				if (_columnCount > 1 && _colWidths.Sum() > availableSize.Width)
				{
					_columnCount--;
					flag = true;
					break;
				}
				_rowHeights.Add(num);
			}
		}
	}

	public Rect GetPosition(int index)
	{
		int num = index % _columnCount;
		int num2 = index / _columnCount;
		double num3 = 0.0;
		for (int i = 0; i < num; i++)
		{
			num3 += _colWidths[i];
		}
		double num4 = 0.0;
		for (int j = 0; j < num2; j++)
		{
			num4 += _rowHeights[j];
		}
		return new Rect(new Point(num3, num4), new Size(_colWidths[num], _rowHeights[num2]));
	}

	public int GetIndex(Point position)
	{
		int num = 0;
		double num2 = 0.0;
		while (num2 < position.X && _columnCount > num)
		{
			num2 += _colWidths[num];
			num++;
		}
		num--;
		int num3 = 0;
		double num4 = 0.0;
		while (num4 < position.Y && _rowHeights.Count > num3)
		{
			num4 += _rowHeights[num3];
			num3++;
		}
		num3--;
		if (num3 < 0)
		{
			num3 = 0;
		}
		if (num < 0)
		{
			num = 0;
		}
		if (num >= _columnCount)
		{
			num = _columnCount - 1;
		}
		int num5 = num3 * _columnCount + num;
		if (num5 > _elementCount)
		{
			num5 = _elementCount - 1;
		}
		return num5;
	}

	private void AdjustEmptySpace(Size availableSize)
	{
		double num = _colWidths.Sum();
		if ((availableSize.Width != double.PositiveInfinity || availableSize.Height != double.PositiveInfinity) && !double.IsNaN(availableSize.Width) && availableSize.Width > num)
		{
			double num2 = (availableSize.Width - num) / (double)_columnCount;
			for (int i = 0; i < _columnCount; i++)
			{
				_colWidths[i] += num2;
			}
		}
	}

	private void ResetSizes()
	{
		_rowHeights.Clear();
		for (int i = 0; i < _colWidths.Length; i++)
		{
			_colWidths[i] = 0.0;
		}
	}

	private static int GetColumnCount(Size availableSize, Size[] measures)
	{
		double num = 0.0;
		for (int i = 0; i < measures.Length; i++)
		{
			double num2 = num + measures[i].Width;
			if (num2 > availableSize.Width)
			{
				return Math.Max(1, i);
			}
			num = num2;
		}
		return measures.Length;
	}
}
